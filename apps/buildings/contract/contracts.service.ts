import { ContractQueryDto } from '@app/contracts/contracts/contract-query.dto'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaService } from '../prisma/prisma.service'
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto'
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ContractsService {
    private s3: S3Client
    private bucketName: string

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.s3 = new S3Client({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
            },
        })
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')
    }

    private async uploadToS3(file: any): Promise<string> {
        try {
            const fileName = `${uuidv4()}-${file.originalname}`

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: `contracts/${fileName}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            })

            await this.s3.send(command)

            // Return the S3 URL
            return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/contracts/${fileName}`
        } catch (error) {
            console.error('Error uploading to S3:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Error uploading contract file to S3',
            })
        }
    }

    // Create a new contract with devices
    async createContract(createContractDto: CreateContractDto, file: any) {
        let fileUrl = null
        try {
            // Upload the file to S3 and get URL
            fileUrl = await this.uploadToS3(file)

            // Use transaction to ensure data consistency
            const result = await this.prisma.$transaction(async (tx) => {
                // Create the contract with the file reference
                const newContract = await tx.contract.create({
                    data: {
                        start_date: createContractDto.start_date ? new Date(createContractDto.start_date) : null,
                        end_date: createContractDto.end_date ? new Date(createContractDto.end_date) : null,
                        vendor: createContractDto.vendor || null,
                        file_name: fileUrl,
                    },
                })

                // Create devices and associate them with the contract
                if (createContractDto.devices) {
                    // Parse devices if it's a string
                    let deviceArray = createContractDto.devices
                    if (typeof deviceArray === 'string') {
                        try {
                            deviceArray = JSON.parse(deviceArray)
                        } catch (error) {
                            throw new RpcException({
                                statusCode: 400,
                                message: 'Invalid devices JSON format',
                            })
                        }
                    }

                    if (Array.isArray(deviceArray) && deviceArray.length > 0) {
                        // Lọc bỏ các thiết bị không có buildingDetailId
                        const validDevices = deviceArray.filter(d => d.buildingDetailId)

                        if (validDevices.length === 0) {
                            // Tạo hợp đồng không có thiết bị nếu không có thiết bị nào hợp lệ
                            return {
                                statusCode: 201,
                                message: 'Contract created successfully without devices (all devices had missing buildingDetailId)',
                                data: newContract,
                            }
                        }

                        // Get all unique buildingDetailIds to validate - filter out undefined/null values
                        const buildingDetailIds = [...new Set(validDevices.map(d => d.buildingDetailId))]

                        // Only proceed with validation if there are valid IDs
                        if (buildingDetailIds.length > 0) {
                            // Check if all buildingDetailIds exist
                            const existingBuildingDetails = await tx.buildingDetail.findMany({
                                where: {
                                    buildingDetailId: {
                                        in: buildingDetailIds
                                    }
                                },
                                select: {
                                    buildingDetailId: true
                                }
                            })

                            // Convert to a Set for easy lookup
                            const existingIds = new Set(existingBuildingDetails.map(bd => bd.buildingDetailId))

                            // Find missing IDs
                            const missingIds = buildingDetailIds.filter(id => !existingIds.has(id))

                            if (missingIds.length > 0) {
                                throw new RpcException({
                                    statusCode: 404,
                                    message: `Building Detail IDs not found: ${missingIds.join(', ')}`,
                                })
                            }
                        }

                        // Tạo device chỉ với những thiết bị hợp lệ trong cùng một transaction
                        const createdDevices = []
                        for (const deviceDto of validDevices) {
                            const device = await tx.device.create({
                                data: {
                                    name: deviceDto.name,
                                    type: deviceDto.type,
                                    manufacturer: deviceDto.manufacturer,
                                    model: deviceDto.model,
                                    buildingDetailId: deviceDto.buildingDetailId,
                                    contract_id: newContract.contract_id,
                                }
                            })
                            createdDevices.push(device)
                        }

                        return {
                            statusCode: 201,
                            message: 'Contract created successfully with devices',
                            data: {
                                ...newContract,
                                devices: createdDevices
                            },
                        }
                    }
                }

                return {
                    statusCode: 201,
                    message: 'Contract created successfully',
                    data: newContract,
                }
            }, {
                maxWait: 5000, // maximum time to wait to acquire transaction lock (ms)
                timeout: 10000, // maximum time for the transaction to complete (ms)
                isolationLevel: 'ReadCommitted' // transaction isolation level
            })

            return result
        } catch (error) {
            console.error('Error during contract creation:', error)

            // If it's already an RpcException, rethrow it
            if (error instanceof RpcException) {
                throw error
            }

            // Check for Prisma validation errors
            if (error.name === 'PrismaClientValidationError') {
                throw new RpcException({
                    statusCode: 400,
                    message: 'Invalid data format for contract creation',
                    error: error.message
                })
            }

            // Check for Prisma not found errors
            if (error.code === 'P2025' || error.message?.includes('not found')) {
                throw new RpcException({
                    statusCode: 404,
                    message: error.message || 'Resource not found',
                })
            }

            // Default error
            throw new RpcException({
                statusCode: 400,
                message: 'Contract creation failed',
                error: error.message,
            })
        }
    }

    // Get all contracts with pagination, filtering, searching, and auto-sorting by newest
    async getAllContracts(queryDto: ContractQueryDto) {
        try {
            console.log('Query parameters:', queryDto)

            // Default values if not provided
            const page = queryDto?.page || 1
            const limit = queryDto?.limit || 10
            const search = queryDto?.search || ''

            // Calculate skip value for pagination
            const skip = (page - 1) * limit

            // Create where condition for filtering
            const where: any = {}

            // Search in vendor field
            if (search) {
                where.OR = [
                    { vendor: { contains: search, mode: 'insensitive' } },
                ]
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
            ])

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
            }
        } catch (error) {
            console.error('Error retrieving contracts:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Error retrieving contracts',
                error: error.message,
            })
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
            })

            if (!contract) {
                return {
                    statusCode: 404,
                    message: 'Contract not found',
                }
            }

            return {
                statusCode: 200,
                message: 'Contract retrieved successfully',
                data: contract,
            }
        } catch (error) {
            console.error('Error retrieving contract:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Error retrieving contract',
            })
        }
    }

    // Update a contract
    async updateContract(contractId: string, updateContractDto: UpdateContractDto) {
        try {
            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            })

            if (!existingContract) {
                return {
                    statusCode: 404,
                    message: 'Contract not found',
                }
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
            })

            return {
                statusCode: 200,
                message: 'Contract updated successfully',
                data: updatedContract,
            }
        } catch (error) {
            console.error('Error updating contract:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Error updating contract',
            })
        }
    }

    // Delete a contract
    async deleteContract(contractId: string) {
        try {
            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            })

            if (!existingContract) {
                return {
                    statusCode: 404,
                    message: 'Contract not found',
                }
            }

            // Delete the contract
            await this.prisma.contract.delete({
                where: { contract_id: contractId },
            })

            return {
                statusCode: 200,
                message: 'Contract deleted successfully',
            }
        } catch (error) {
            console.error('Error deleting contract:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Error deleting contract',
            })
        }
    }
}
