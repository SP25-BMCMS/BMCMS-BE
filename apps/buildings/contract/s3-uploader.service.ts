import { Injectable } from '@nestjs/common'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { ConfigService } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'
import { RpcException } from '@nestjs/microservices'

@Injectable()
export class S3UploaderService {
    private s3: S3Client
    private bucketName: string

    constructor(private configService: ConfigService) {
        this.s3 = new S3Client({
            region: this.configService.get<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
            },
        })
        this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        try {
            // Check if buffer is base64 string
            let fileBuffer: Buffer
            if (typeof file.buffer === 'string') {
                fileBuffer = Buffer.from(file.buffer, 'base64')
            } else if (Buffer.isBuffer(file.buffer)) {
                fileBuffer = file.buffer
            } else {
                throw new Error('Invalid file buffer format')
            }

            const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
            const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`
            const s3Key = `contracts/${uniqueFilename}`

            console.log('Uploading file to S3:', {
                fileName: uniqueFilename,
                s3Key,
                contentType: file.mimetype,
                fileSize: file.size,
                bufferType: typeof file.buffer,
                bufferLength: file.buffer?.length
            })

            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: s3Key,
                    Body: fileBuffer,
                    ContentType: 'application/pdf',
                    ContentDisposition: 'inline',
                    Metadata: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'inline'
                    }
                })
            )

            const s3Url = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${s3Key}`
            console.log('File uploaded successfully:', s3Url)
            return s3Url
        } catch (error) {
            console.error('Error uploading file to S3:', error)
            throw new Error('Error uploading file to S3')
        }
    }
} 