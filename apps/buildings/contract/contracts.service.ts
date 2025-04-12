import { ContractQueryDto } from '@app/contracts/contracts/contract-query.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client-building';
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto';
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto';

@Injectable()
export class ContractsService {
    private prisma = new PrismaClient();

    // Create a new contract
    async createContract(createContractDto: CreateContractDto) {
        try {
            const newContract = await this.prisma.contract.create({
                data: {
                    start_date: createContractDto.start_date ? new Date(createContractDto.start_date) : null,
                    end_date: createContractDto.end_date ? new Date(createContractDto.end_date) : null,
                    vendor: createContractDto.vendor || null,
                },
                include: {
                    devices: true,
                },
            });

            return {
                statusCode: 201,
                message: 'Contract created successfully',
                data: newContract,
            };
        } catch (error) {
            console.error('Error during contract creation:', error);
            throw new RpcException({
                statusCode: 400,
                message: 'Contract creation failed',
            });
        }
    }

    // Get all contracts with pagination, filtering, searching, and auto-sorting by newest
    async getAllContracts(queryDto: ContractQueryDto) {
        try {
            console.log('Query parameters:', queryDto);

            // Default values if not provided
            const page = queryDto?.page || 1;
            const limit = queryDto?.limit || 10;
            const search = queryDto?.search || '';

            // Calculate skip value for pagination
            const skip = (page - 1) * limit;

            // Create where condition for filtering
            const where: any = {};

            // Search in vendor field
            if (search) {
                where.OR = [
                    { vendor: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Get paginated data with auto-sorting by newest first (assuming contract_id is sequential)
            const [contracts, total] = await Promise.all([
                this.prisma.contract.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        devices: true,
                    },
                    orderBy: {
                        createdAt: 'desc', // Sort by most recent contract_id in descending order
                    },
                }),
                this.prisma.contract.count({ where }),
            ]);

            return {
                statusCode: 200,
                message: 'Contracts retrieved successfully',
                data: contracts,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
                filters: {
                    search,
                },
            };
        } catch (error) {
            console.error('Error retrieving contracts:', error);
            throw new RpcException({
                statusCode: 500,
                message: 'Error retrieving contracts',
                error: error.message,
            });
        }
    }

    // Get a contract by ID
    async getContractById(contractId: string) {
        try {
            const contract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
                include: {
                    devices: true,
                },
            });

            if (!contract) {
                return {
                    statusCode: 404,
                    message: 'Contract not found',
                };
            }

            return {
                statusCode: 200,
                message: 'Contract retrieved successfully',
                data: contract,
            };
        } catch (error) {
            console.error('Error retrieving contract:', error);
            throw new RpcException({
                statusCode: 500,
                message: 'Error retrieving contract',
            });
        }
    }

    // Update a contract
    async updateContract(contractId: string, updateContractDto: UpdateContractDto) {
        try {
            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            });

            if (!existingContract) {
                return {
                    statusCode: 404,
                    message: 'Contract not found',
                };
            }

            // Update the contract
            const updatedContract = await this.prisma.contract.update({
                where: { contract_id: contractId },
                data: {
                    start_date: updateContractDto.start_date ? new Date(updateContractDto.start_date) : undefined,
                    end_date: updateContractDto.end_date ? new Date(updateContractDto.end_date) : undefined,
                    vendor: updateContractDto.vendor,
                },
                include: {
                    devices: true,
                },
            });

            return {
                statusCode: 200,
                message: 'Contract updated successfully',
                data: updatedContract,
            };
        } catch (error) {
            console.error('Error updating contract:', error);
            throw new RpcException({
                statusCode: 500,
                message: 'Error updating contract',
            });
        }
    }

    // Delete a contract
    async deleteContract(contractId: string) {
        try {
            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            });

            if (!existingContract) {
                return {
                    statusCode: 404,
                    message: 'Contract not found',
                };
            }

            // Delete the contract
            await this.prisma.contract.delete({
                where: { contract_id: contractId },
            });

            return {
                statusCode: 200,
                message: 'Contract deleted successfully',
            };
        } catch (error) {
            console.error('Error deleting contract:', error);
            throw new RpcException({
                statusCode: 500,
                message: 'Error deleting contract',
            });
        }
    }
}
