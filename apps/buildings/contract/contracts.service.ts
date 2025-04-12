import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from '@app/contracts/contracts/create-contract.dto';
import { UpdateContractDto } from '@app/contracts/contracts/update-contract.dto';
import { ApiResponse } from '@app/contracts/ApiResponse/api-response';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    // Create a new contract
    async createContract(createContractDto: CreateContractDto): Promise<ApiResponse<any>> {
        try {
            const newContract = await this.prisma.contract.create({
                data: {
                    ...createContractDto,
                    start_date: createContractDto.start_date ? new Date(createContractDto.start_date) : null,
                    end_date: createContractDto.end_date ? new Date(createContractDto.end_date) : null,
                },
            });

            return new ApiResponse(true, 'Contract created successfully', newContract);
        } catch (error) {
            throw new RpcException({
                statusCode: 400,
                message: `Failed to create contract: ${error.message}`,
            });
        }
    }

    // Get all contracts
    async getAllContracts(): Promise<ApiResponse<any>> {
        try {
            const contracts = await this.prisma.contract.findMany({
                include: {
                    devices: true,
                },
            });

            return new ApiResponse(true, 'Contracts retrieved successfully', contracts);
        } catch (error) {
            throw new RpcException({
                statusCode: 500,
                message: `Failed to retrieve contracts: ${error.message}`,
            });
        }
    }

    // Get contract by ID
    async getContractById(contractId: string): Promise<ApiResponse<any>> {
        try {
            const contract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
                include: {
                    devices: true,
                },
            });

            if (!contract) {
                return new ApiResponse(false, `Contract with ID ${contractId} not found`, null);
            }

            return new ApiResponse(true, 'Contract retrieved successfully', contract);
        } catch (error) {
            throw new RpcException({
                statusCode: 500,
                message: `Failed to retrieve contract: ${error.message}`,
            });
        }
    }

    // Update a contract
    async updateContract(contractId: string, updateContractDto: UpdateContractDto): Promise<ApiResponse<any>> {
        try {
            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            });

            if (!existingContract) {
                return new ApiResponse(false, `Contract with ID ${contractId} not found`, null);
            }

            // Update the contract
            const updatedContract = await this.prisma.contract.update({
                where: { contract_id: contractId },
                data: {
                    ...updateContractDto,
                    start_date: updateContractDto.start_date ? new Date(updateContractDto.start_date) : undefined,
                    end_date: updateContractDto.end_date ? new Date(updateContractDto.end_date) : undefined,
                },
                include: {
                    devices: true,
                },
            });

            return new ApiResponse(true, 'Contract updated successfully', updatedContract);
        } catch (error) {
            throw new RpcException({
                statusCode: 400,
                message: `Failed to update contract: ${error.message}`,
            });
        }
    }

    // Delete a contract
    async deleteContract(contractId: string): Promise<ApiResponse<any>> {
        try {
            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            });

            if (!existingContract) {
                return new ApiResponse(false, `Contract with ID ${contractId} not found`, null);
            }

            // Delete the contract
            await this.prisma.contract.delete({
                where: { contract_id: contractId },
            });

            return new ApiResponse(true, 'Contract deleted successfully', { contractId });
        } catch (error) {
            throw new RpcException({
                statusCode: 400,
                message: `Failed to delete contract: ${error.message}`,
            });
        }
    }
}
