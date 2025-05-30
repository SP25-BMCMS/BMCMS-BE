import { ContractQueryDto } from '@app/contracts/contracts/contract-query.dto'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PrismaService } from '../prisma/prisma.service'
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto'
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { ConfigService } from '@nestjs/config'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3UploaderService } from './s3-uploader.service'

@Injectable()
export class ContractsService {
    private s3: S3Client
    private bucketName: string

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly s3UploaderService: S3UploaderService,
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

    // Hàm trích xuất file key từ URL
    private extractFileKey(urlString: string): string {
        try {
            const url = new URL(urlString)
            // Lấy pathname và bỏ dấu '/' đầu tiên
            const pathname = url.pathname.substring(1)
            console.log('Extracted file key:', pathname)
            return pathname
        } catch (error) {
            console.error('Invalid URL:', urlString)
            throw new Error('Invalid URL format')
        }
    }

    // Hàm tạo presigned URL
    async getPreSignedUrl(fileKey: string): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ResponseContentType: 'application/pdf' // Thêm content type để đảm bảo file được trả về đúng định dạng
            })

            // Tạo presigned URL với thời hạn 1 giờ
            const presignedUrl = await getSignedUrl(this.s3, command, {
                expiresIn: 3600
            })

            console.log('Generated presigned URL:', presignedUrl)
            return presignedUrl
        } catch (error) {
            console.error('Error generating presigned URL:', error)
            throw error
        }
    }

    // Hàm tạo presigned URL with content disposition
    async getPreSignedUrlWithDisposition(fileKey: string, contentDisposition: string): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ResponseContentType: 'application/pdf',
                ResponseContentDisposition: contentDisposition
            });

            // Create presigned URL with 1 hour expiration
            const presignedUrl = await getSignedUrl(this.s3, command, {
                expiresIn: 3600
            });

            console.log(`Generated presigned URL with ${contentDisposition}:`, presignedUrl);
            return presignedUrl;
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            throw error;
        }
    }

    // Create a new contract with devices
    async createContract(createContractDto: CreateContractDto, file: any) {
        try {
            // Upload the file to S3 and get URL
            const s3Url = await this.s3UploaderService.uploadFile(file)

            // Use transaction to ensure data consistency
            const result = await this.prisma.$transaction(async (tx) => {
                // Create the contract with the file reference
                const newContract = await tx.contract.create({
                    data: {
                        start_date: createContractDto.start_date ? new Date(createContractDto.start_date) : null,
                        end_date: createContractDto.end_date ? new Date(createContractDto.end_date) : null,
                        vendor: createContractDto.vendor || null,
                        file_name: s3Url, // Store full S3 URL
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
                                message: 'Định dạng JSON thiết bị không hợp lệ',
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
                                message: 'Tạo hợp đồng thành công không có thiết bị (tất cả thiết bị đều thiếu buildingDetailId)',
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
                                    message: `Không tìm thấy ID chi tiết tòa nhà: ${missingIds.join(', ')}`,
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
                            message: 'Tạo hợp đồng thành công với thiết bị',
                            data: {
                                ...newContract,
                                devices: createdDevices
                            },
                        }
                    }
                }

                return {
                    statusCode: 201,
                    message: 'Tạo hợp đồng thành công',
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
                    message: 'Định dạng dữ liệu không hợp lệ cho việc tạo hợp đồng',
                    error: error.message
                })
            }

            // Check for Prisma not found errors
            if (error.code === 'P2025' || error.message?.includes('not found')) {
                throw new RpcException({
                    statusCode: 404,
                    message: error.message || 'Không tìm thấy tài nguyên',
                })
            }

            // Default error
            throw new RpcException({
                statusCode: 400,
                message: 'Tạo hợp đồng thất bại',
                error: error.message,
            })
        }
    }

    // Get all contracts with pagination and search
    async getAllContracts(query: ContractQueryDto) {
        try {
            const page = query.page || 1
            const limit = query.limit || 10
            const skip = (page - 1) * limit

            const contracts = await this.prisma.contract.findMany({
                where: query.search ? {
                    vendor: { contains: query.search, mode: 'insensitive' }
                } : undefined,
                skip,
                take: limit,
                include: {
                    devices: true,
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            const total = await this.prisma.contract.count({
                where: query.search ? {
                    vendor: { contains: query.search, mode: 'insensitive' }
                } : undefined
            })

            // Convert S3 URLs to presigned URLs
            const contractsWithPresignedUrls = await Promise.all(
                contracts.map(async (contract) => {
                    try {
                        if (!contract.file_name) {
                            return contract;
                        }

                        const fileKey = this.extractFileKey(contract.file_name);
                        const fileName = fileKey.split('/').pop() || 'document.pdf';

                        // Generate different presigned URLs for different use cases
                        const directFileUrl = await this.getPreSignedUrl(fileKey); // For direct access without attachment
                        const fileUrl = await this.getPreSignedUrlWithDisposition(fileKey, `attachment; filename="${fileName}"`); // For downloading
                        const viewUrl = await this.getPreSignedUrlWithDisposition(fileKey, 'inline'); // For inline viewing in browser

                        return {
                            ...contract,
                            directFileUrl,
                            fileUrl,
                            viewUrl
                        };
                    } catch (error) {
                        console.error('Error creating presigned URLs:', error);
                        return contract; // Return original contract if presigned URL creation fails
                    }
                })
            )

            return {
                data: contractsWithPresignedUrls,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        } catch (error) {
            console.error('Error getting contracts:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Lỗi khi lấy danh sách hợp đồng',
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
            });

            if (!contract) {
                throw new RpcException({
                    statusCode: 404,
                    message: 'Không tìm thấy hợp đồng',
                });
            }

            // Add presigned URLs if contract has a file
            if (contract.file_name) {
                try {
                    const fileKey = this.extractFileKey(contract.file_name);
                    const fileName = fileKey.split('/').pop() || 'document.pdf';

                    // Generate different presigned URLs for different use cases
                    const directFileUrl = await this.getPreSignedUrl(fileKey); // For direct access without attachment
                    const fileUrl = await this.getPreSignedUrlWithDisposition(fileKey, `attachment; filename="${fileName}"`); // For downloading
                    const viewUrl = await this.getPreSignedUrlWithDisposition(fileKey, 'inline'); // For inline viewing in browser

                    return {
                        data: {
                            ...contract,
                            fileUrl,
                            viewUrl,
                            directFileUrl
                        }
                    };
                } catch (error) {
                    console.error('Error creating presigned URLs:', error);
                    return { data: contract }; // Return original contract if presigned URL creation fails
                }
            }

            return { data: contract };
        } catch (error) {
            console.error('Error getting contract:', error);
            throw new RpcException({
                statusCode: 500,
                message: 'Lỗi khi lấy thông tin hợp đồng',
            });
        }
    }

    // Update a contract with a new file
    async updateContractWithFile(contractId: string, updateContractDto: UpdateContractDto, file: any) {
        try {
            console.log('Received update DTO:', updateContractDto);

            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            })

            if (!existingContract) {
                return {
                    statusCode: 404,
                    message: 'Không tìm thấy hợp đồng',
                }
            }

            // Upload the new file to S3 if provided
            let s3Url = existingContract.file_name; // Keep the existing URL if no new file

            if (file) {
                // Upload the file to S3 and get the new URL
                s3Url = await this.s3UploaderService.uploadFile(file);
            }

            // Prepare update data, only including fields that were explicitly provided
            const updateData: any = {};

            if (updateContractDto.start_date !== undefined) {
                // Validate the date before setting it
                const startDate = new Date(updateContractDto.start_date);
                if (!isNaN(startDate.getTime())) {
                    updateData.start_date = startDate;
                }
            }

            if (updateContractDto.end_date !== undefined) {
                // Validate the date before setting it
                const endDate = new Date(updateContractDto.end_date);
                if (!isNaN(endDate.getTime())) {
                    updateData.end_date = endDate;
                }
            }

            // Only update vendor if it was explicitly provided and is not an empty string
            if (updateContractDto.vendor !== undefined && updateContractDto.vendor !== '') {
                updateData.vendor = updateContractDto.vendor;
            }

            // Always update file_name if we have a new one
            if (s3Url) {
                updateData.file_name = s3Url;
            }

            console.log('Updating contract with data:', updateData);

            // Update the contract
            const updatedContract = await this.prisma.contract.update({
                where: { contract_id: contractId },
                data: updateData,
                include: {
                    devices: true,
                },
            })

            return {
                statusCode: 200,
                message: 'Cập nhật hợp đồng thành công',
                data: updatedContract,
            }
        } catch (error) {
            console.error('Error updating contract with file:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Lỗi khi cập nhật hợp đồng với file',
            })
        }
    }

    // Update a contract
    async updateContract(contractId: string, updateContractDto: UpdateContractDto) {
        try {
            console.log('Received update DTO:', updateContractDto);

            // Check if contract exists
            const existingContract = await this.prisma.contract.findUnique({
                where: { contract_id: contractId },
            })

            if (!existingContract) {
                return {
                    statusCode: 404,
                    message: 'Không tìm thấy hợp đồng',
                }
            }

            // Prepare update data, only including fields that were explicitly provided
            const updateData: any = {};

            if (updateContractDto.start_date !== undefined) {
                // Validate the date before setting it
                const startDate = new Date(updateContractDto.start_date);
                if (!isNaN(startDate.getTime())) {
                    updateData.start_date = startDate;
                }
            }

            if (updateContractDto.end_date !== undefined) {
                // Validate the date before setting it
                const endDate = new Date(updateContractDto.end_date);
                if (!isNaN(endDate.getTime())) {
                    updateData.end_date = endDate;
                }
            }

            // Only update vendor if it was explicitly provided and is not an empty string
            if (updateContractDto.vendor !== undefined && updateContractDto.vendor !== '') {
                updateData.vendor = updateContractDto.vendor;
            }

            console.log('Updating contract with data:', updateData);

            // Update the contract
            const updatedContract = await this.prisma.contract.update({
                where: { contract_id: contractId },
                data: updateData,
                include: {
                    devices: true,
                },
            })

            return {
                statusCode: 200,
                message: 'Cập nhật hợp đồng thành công',
                data: updatedContract,
            }
        } catch (error) {
            console.error('Error updating contract:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Lỗi khi cập nhật hợp đồng',
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
                    message: 'Không tìm thấy hợp đồng',
                }
            }

            // Delete the contract
            await this.prisma.contract.delete({
                where: { contract_id: contractId },
            })

            return {
                statusCode: 200,
                message: 'Xóa hợp đồng thành công',
            }
        } catch (error) {
            console.error('Error deleting contract:', error)
            throw new RpcException({
                statusCode: 500,
                message: 'Lỗi khi xóa hợp đồng',
            })
        }
    }
}
