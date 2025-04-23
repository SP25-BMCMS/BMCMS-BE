import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    Req,
    HttpException,
    HttpStatus,
    Res,
} from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger'
import { ContractsService } from './contracts.service'
import { CreateContractDto } from 'libs/contracts/src/contracts/create-contract.dto'
import { UpdateContractDto } from 'libs/contracts/src/contracts/update-contract.dto'
import { PassportJwtAuthGuard } from '../guards/passport-jwt-guard'
import { ContractQueryDto } from '@app/contracts/contracts/contract-query.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

@ApiTags('Contracts')
@Controller('contracts')
@ApiBearerAuth()
// @UseGuards(PassportJwtAuthGuard)
export class ContractsController {
    private readonly uploadsPath = path.join(process.cwd(), 'uploads');

    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new contract with a PDF file and devices' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                start_date: {
                    type: 'string',
                    format: 'date',
                    example: '2023-01-01',
                    description: 'The start date of the contract'
                },
                end_date: {
                    type: 'string',
                    format: 'date',
                    example: '2024-01-01',
                    description: 'The end date of the contract'
                },
                vendor: {
                    type: 'string',
                    example: 'ABC Company',
                    description: 'The vendor of the contract'
                },
                contractFile: {
                    type: 'string',
                    format: 'binary',
                    description: 'Contract file (PDF only, maximum 10MB)'
                },
                devices: {
                    type: 'array',
                    description: 'Array of devices to be associated with this contract',
                    items: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                example: 'Air Conditioner',
                                description: 'Device name'
                            },
                            type: {
                                type: 'string',
                                example: 'HVAC',
                                description: 'Device type'
                            },
                            manufacturer: {
                                type: 'string',
                                example: 'Samsung',
                                description: 'Device manufacturer'
                            },
                            model: {
                                type: 'string',
                                example: 'AC-2000',
                                description: 'Device model'
                            },
                            buildingDetailId: {
                                type: 'string',
                                example: '550e8400-e29b-41d4-a716-446655440000',
                                description: 'Building detail ID where the device is located'
                            }
                        },
                        required: ['name', 'buildingDetailId']
                    }
                }
            },
            required: ['contractFile']
        }
    })
    @UseInterceptors(
        FileInterceptor('contractFile', {
            fileFilter: (req, file, callback) => {
                console.log('File upload attempt:', {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                })

                const allowedMimeTypes = [
                    'application/pdf'
                ]

                if (allowedMimeTypes.includes(file.mimetype)) {
                    callback(null, true)
                } else {
                    console.error('Invalid file type:', file.mimetype)
                    callback(
                        new HttpException(
                            {
                                statusCode: HttpStatus.BAD_REQUEST,
                                message: 'Only PDF files are allowed'
                            },
                            HttpStatus.BAD_REQUEST
                        ),
                        false
                    )
                }
            }
        })
    )
    async createContract(
        @Body() createContractDto: any,
        @UploadedFile() file: Express.Multer.File,
        @Req() req
    ) {
        try {
            console.log('Creating contract with data:', {
                dto: createContractDto,
                fileInfo: file ? {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                } : null
            })

            if (!file) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'Contract file is required'
                    },
                    HttpStatus.BAD_REQUEST
                )
            }

            // Xử lý trường devices một cách linh hoạt
            if (createContractDto.devices) {
                try {
                    // Trường hợp 1: Đã là mảng object (từ form-data có Content-Type: multipart/form-data)
                    if (Array.isArray(createContractDto.devices)) {
                        // Đã là mảng, không cần xử lý gì thêm
                    }
                    // Trường hợp 2: Chuỗi JSON (từ form-data truyền text)
                    else if (typeof createContractDto.devices === 'string') {
                        // Xử lý trường hợp chuỗi rỗng hoặc không hợp lệ
                        if (!createContractDto.devices.trim()) {
                            createContractDto.devices = []
                        } else {
                            try {
                                // Trường hợp từ Swagger UI - gửi object đơn không có dấu []
                                if (createContractDto.devices.trim().startsWith('{') &&
                                    createContractDto.devices.trim().endsWith('}')) {
                                    // Bọc object trong mảng
                                    createContractDto.devices = JSON.parse('[' + createContractDto.devices + ']')
                                } else {
                                    createContractDto.devices = JSON.parse(createContractDto.devices)
                                }
                            } catch (e) {
                                console.error("JSON parse error:", e.message)
                                // Thử xử lý dấu nháy đơn thay vì nháy kép
                                const fixedString = createContractDto.devices
                                    .replace(/'/g, '"')        // Thay thế nháy đơn bằng nháy kép
                                    .replace(/(\w+):/g, '"$1":') // Thêm dấu nháy kép cho key
                                    .replace(/:\s*([^",\{\}\[\]]+)/g, ':"$1"') // Thêm dấu nháy kép cho value

                                try {
                                    // Kiểm tra nếu là object đơn không có dấu []
                                    if (fixedString.trim().startsWith('{') &&
                                        fixedString.trim().endsWith('}')) {
                                        // Bọc object trong mảng
                                        createContractDto.devices = JSON.parse('[' + fixedString + ']')
                                    } else {
                                        createContractDto.devices = JSON.parse(fixedString)
                                    }
                                } catch (e2) {
                                    console.error("Fixed JSON parse error:", e2.message, "Original:", createContractDto.devices)
                                    throw new HttpException(
                                        {
                                            statusCode: HttpStatus.BAD_REQUEST,
                                            message: 'Invalid devices JSON format. Please provide a valid array of devices.'
                                        },
                                        HttpStatus.BAD_REQUEST
                                    )
                                }
                            }
                        }
                    }

                    // Đảm bảo devices là một mảng
                    if (!Array.isArray(createContractDto.devices)) {
                        // Nếu là object đơn, chuyển thành mảng
                        if (typeof createContractDto.devices === 'object') {
                            createContractDto.devices = [createContractDto.devices]
                        } else {
                            createContractDto.devices = []
                        }
                    }

                    // Validate dữ liệu devices
                    for (const device of createContractDto.devices) {
                        if (!device.name) {
                            throw new HttpException(
                                {
                                    statusCode: HttpStatus.BAD_REQUEST,
                                    message: 'Device name is required'
                                },
                                HttpStatus.BAD_REQUEST
                            )
                        }
                        if (!device.buildingDetailId) {
                            throw new HttpException(
                                {
                                    statusCode: HttpStatus.BAD_REQUEST,
                                    message: 'buildingDetailId is required for each device'
                                },
                                HttpStatus.BAD_REQUEST
                            )
                        }
                    }
                } catch (error) {
                    console.error('Error processing devices:', error)
                    if (error instanceof HttpException) throw error

                    throw new HttpException(
                        {
                            statusCode: HttpStatus.BAD_REQUEST,
                            message: 'Invalid devices data: ' + (error.message || 'Unknown error')
                        },
                        HttpStatus.BAD_REQUEST
                    )
                }
            } else {
                // Nếu không có devices, khởi tạo mảng rỗng
                createContractDto.devices = []
            }

            // Process file for microservice transport
            const processedFile = {
                ...file,
                buffer: file.buffer.toString('base64') // Convert buffer to base64 string for transport
            }

            console.log('Sending request to microservice with file info:', {
                originalname: processedFile.originalname,
                mimetype: processedFile.mimetype,
                size: processedFile.size,
                bufferType: typeof processedFile.buffer,
                bufferLength: processedFile.buffer.length
            })

            console.log('Sending request to microservice...')
            const result = await this.contractsService.createContract(createContractDto, processedFile)
            console.log('Microservice response:', result)

            return result
        } catch (error) {
            console.error('Error in controller:', error)

            // Nếu đã là HttpException, chỉ cần rethrow
            if (error instanceof HttpException) {
                throw error
            }

            // Các lỗi khác
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected error occurred during contract creation'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all contracts with pagination, filtering, and sorting' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter vendor name' })
    async getAllContracts(@Query() queryDto: ContractQueryDto) {
        try {
            // Simply return the data from the microservice without adding URLs
            return await this.contractsService.getAllContracts(queryDto);
        } catch (error) {
            this.handleMicroserviceError(error);
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a contract by ID' })
    async getContractById(@Param('id') contractId: string) {
        try {
            const result = await this.contractsService.getContractById(contractId);
            // URLs are now added by the microservice, no need to process them here
            return result;
        } catch (error) {
            this.handleMicroserviceError(error);
        }
    }

    @Get('download/:id')
    @ApiOperation({
        summary: 'Download the contract file',
        description: 'Redirects to a presigned S3 URL for downloading the PDF file associated with the contract'
    })
    async downloadContractFile(@Param('id') contractId: string, @Res() res: Response) {
        try {
            const result = await this.contractsService.getContractById(contractId);

            if (!result?.data?.fileUrl) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.NOT_FOUND,
                        message: 'Contract file not found'
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            // Redirect to the presigned S3 URL for downloading
            return res.redirect(result.data.fileUrl);
        } catch (error) {
            console.error('Error downloading file:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Error downloading contract file'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('view/:id')
    @ApiOperation({
        summary: 'View the contract file in browser',
        description: 'Redirects to a presigned S3 URL for viewing the PDF file directly in the browser'
    })
    async viewContractFile(@Param('id') contractId: string, @Res() res: Response) {
        try {
            const result = await this.contractsService.getContractById(contractId);

            if (!result?.data?.viewUrl) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.NOT_FOUND,
                        message: 'Contract file not found'
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            // Redirect to the presigned S3 URL for inline viewing
            return res.redirect(result.data.viewUrl);
        } catch (error) {
            console.error('Error viewing file:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Error viewing contract file'
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a contract' })
    async updateContract(
        @Param('id') contractId: string,
        @Body() updateContractDto: UpdateContractDto,
    ) {
        try {
            return await this.contractsService.updateContract(contractId, updateContractDto)
        } catch (error) {
            this.handleMicroserviceError(error)
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a contract' })
    async deleteContract(@Param('id') contractId: string) {
        try {
            return await this.contractsService.deleteContract(contractId)
        } catch (error) {
            this.handleMicroserviceError(error)
        }
    }

    // Helper method to handle microservice errors
    private handleMicroserviceError(error: any): never {
        console.error('Error from microservice:', error)

        // Check if it's a NestJS HttpException (from interceptors or manual throws)
        if (error instanceof HttpException) {
            throw error
        }

        // Check if the error comes from microservice with error details
        if (error?.response?.statusCode || error?.response?.error?.statusCode) {
            const statusCode = error.response.statusCode ||
                error.response.error?.statusCode ||
                HttpStatus.INTERNAL_SERVER_ERROR
            const message = error.response.message ||
                error.response.error?.message ||
                'Error processing request'

            throw new HttpException({ statusCode, message }, statusCode)
        }

        // For errors with direct error property containing statusCode
        if (error?.error?.statusCode) {
            const statusCode = error.error.statusCode
            const message = error.error.message || 'Error processing request'

            throw new HttpException({ statusCode, message }, statusCode)
        }

        // Default handling for unknown error structures
        throw new HttpException(
            'An unexpected error occurred',
            HttpStatus.INTERNAL_SERVER_ERROR
        )
    }
}
