import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { BUILDING_CLIENT } from '../constraints';
import { CreateTechnicalRecordDto } from '@app/contracts/technicalrecord/create-technicalrecord.dto';
import { UpdateTechnicalRecordDto } from '@app/contracts/technicalrecord/update-technicalrecord.dto';
import { TECHNICALRECORD_PATTERN } from '@app/contracts/technicalrecord/technicalrecord.patterns';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class TechnicalRecordService {
    private s3: S3Client;
    private bucketName: string;

    constructor(
        @Inject(BUILDING_CLIENT) private readonly buildingsClient: ClientProxy,
        private readonly configService: ConfigService,
    ) {
        this.s3 = new S3Client({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
            },
        });
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    }

    // Hàm trích xuất file key từ URL
    private extractFileKey(urlString: string): string {
        try {
            const url = new URL(urlString);
            // Lấy pathname và bỏ dấu '/' đầu tiên
            const pathname = url.pathname.substring(1);
            return pathname;
        } catch (error) {
            console.error('Invalid URL:', urlString);
            throw new Error('Invalid URL format');
        }
    }

    // Hàm tạo presigned URL
    async getPresignedUrl(s3Url: string, contentDisposition: string): Promise<string> {
        try {
            const fileKey = this.extractFileKey(s3Url);
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ResponseContentDisposition: contentDisposition
            });

            // Tạo presigned URL với thời hạn 1 giờ
            const presignedUrl = await getSignedUrl(this.s3, command, {
                expiresIn: 3600
            });

            return presignedUrl;
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            return s3Url; // Trả về URL gốc nếu không thể tạo signed URL
        }
    }

    async create(createTechnicalRecordDto: CreateTechnicalRecordDto, file: any) {
        return await firstValueFrom(
            this.buildingsClient.send(TECHNICALRECORD_PATTERN.CREATE, {
                dto: createTechnicalRecordDto,
                file
            }).pipe(
                catchError((error) => {
                    console.error('Complete error object:', JSON.stringify(error, null, 2));

                    if (error.error?.statusCode) {
                        const statusCode = error.error.statusCode;
                        const message = error.error.message || 'Technical record operation failed';

                        throw new HttpException({ statusCode, message, error: error.error.error }, statusCode);
                    }

                    if (error.err?.error?.statusCode) {
                        const statusCode = error.err.error.statusCode;
                        const message = error.err.error.message || 'Technical record operation failed';

                        throw new HttpException({ statusCode, message, error: error.err.error.error }, statusCode);
                    }

                    if (typeof error === 'object' && error.message && error.message.includes('not found')) {
                        throw new HttpException({
                            statusCode: HttpStatus.NOT_FOUND,
                            message: error.message
                        }, HttpStatus.NOT_FOUND);
                    }

                    throw new HttpException(
                        {
                            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                            message: 'An unexpected error occurred during technical record operation',
                            error: error.message || error
                        },
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                })
            ),
        );
    }

    async findAll(page?: number, limit?: number) {
        try {
            const result = await firstValueFrom(
                this.buildingsClient.send(TECHNICALRECORD_PATTERN.GET_ALL, { page, limit })
                    .pipe(catchError(error => this.handleError(error)))
            );

            // Generate presigned URLs for each record if data is an array
            if (result?.data && Array.isArray(result.data)) {
                for (const record of result.data) {
                    if (record.file_name) {
                        record.fileUrl = await this.getPresignedUrl(record.file_name, 'attachment; filename="' + record.file_name.split('/').pop() + '"');
                        record.viewUrl = await this.getPresignedUrl(record.file_name, 'inline');
                    }
                }
            }

            return result;
        } catch (error) {
            console.error('Error processing technical records:', error);
            throw error;
        }
    }

    async findOne(id: string) {
        try {
            const result = await firstValueFrom(
                this.buildingsClient.send(TECHNICALRECORD_PATTERN.GET_BY_ID, id)
                    .pipe(catchError(error => this.handleError(error)))
            );

            if (result && result.file_name) {
                // Tạo signed URLs cho record
                result.directUrl = result.file_name;
                result.fileUrl = await this.getPresignedUrl(result.file_name, 'attachment; filename="' + result.file_name.split('/').pop() + '"');
                result.viewUrl = await this.getPresignedUrl(result.file_name, 'inline');
            }

            return result;
        } catch (error) {
            console.error('Error processing technical record:', error);
            throw error;
        }
    }

    async findByDeviceId(deviceId: string, page?: number, limit?: number) {
        try {
            const result = await firstValueFrom(
                this.buildingsClient.send(TECHNICALRECORD_PATTERN.GET_BY_DEVICE_ID, { deviceId, page, limit })
                    .pipe(catchError(error => this.handleError(error)))
            );

            if (result?.data && Array.isArray(result.data)) {
                // Tạo signed URLs cho tất cả các records
                for (const record of result.data) {
                    if (record.file_name) {
                        record.directUrl = record.file_name;
                        record.fileUrl = await this.getPresignedUrl(record.file_name, 'attachment; filename="' + record.file_name.split('/').pop() + '"');
                        record.viewUrl = await this.getPresignedUrl(record.file_name, 'inline');
                    }
                }
            }

            return result;
        } catch (error) {
            console.error('Error processing technical records:', error);
            throw error;
        }
    }

    async findByBuildingId(buildingId: string, page?: number, limit?: number) {
        try {
            const result = await firstValueFrom(
                this.buildingsClient.send(TECHNICALRECORD_PATTERN.GET_BY_BUILDING_ID, { buildingId, page, limit })
                    .pipe(catchError(error => this.handleError(error)))
            );

            if (result?.data && Array.isArray(result.data)) {
                // Tạo signed URLs cho tất cả các records
                for (const record of result.data) {
                    if (record.file_name) {
                        record.directUrl = record.file_name;
                        record.fileUrl = await this.getPresignedUrl(record.file_name, 'attachment; filename="' + record.file_name.split('/').pop() + '"');
                        record.viewUrl = await this.getPresignedUrl(record.file_name, 'inline');
                    }
                }
            }

            return result;
        } catch (error) {
            console.error('Error processing technical records:', error);
            throw error;
        }
    }

    async update(id: string, updateTechnicalRecordDto: UpdateTechnicalRecordDto, file?: any) {
        return await firstValueFrom(
            this.buildingsClient.send(TECHNICALRECORD_PATTERN.UPDATE, { id, updateTechnicalRecordDto, file })
                .pipe(catchError(error => this.handleError(error)))
        );
    }

    async remove(id: string) {
        return await firstValueFrom(
            this.buildingsClient.send(TECHNICALRECORD_PATTERN.DELETE, id)
                .pipe(catchError(error => this.handleError(error)))
        );
    }

    private handleError(error: any) {
        console.error('Error from microservice:', error);

        if (error.error?.statusCode) {
            return throwError(() => new HttpException(
                {
                    statusCode: error.error.statusCode,
                    message: error.error.message || 'Technical record operation failed'
                },
                error.error.statusCode
            ));
        }

        if (typeof error === 'object' && error.message && error.message.includes('not found')) {
            return throwError(() => new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: error.message
                },
                HttpStatus.NOT_FOUND
            ));
        }

        return throwError(() => new HttpException(
            {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'An unexpected error occurred'
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        ));
    }
} 