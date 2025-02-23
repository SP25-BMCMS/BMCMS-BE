import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Map gRPC error codes to HTTP status codes.
 */
const grpcToHttpStatus = {
    2: HttpStatus.INTERNAL_SERVER_ERROR,  // UNKNOWN
    3: HttpStatus.BAD_REQUEST,            // INVALID_ARGUMENT
    5: HttpStatus.NOT_FOUND,              // NOT_FOUND
    6: HttpStatus.CONFLICT,               // ALREADY_EXISTS
    7: HttpStatus.FORBIDDEN,              // PERMISSION_DENIED
    16: HttpStatus.UNAUTHORIZED,          // UNAUTHENTICATED
} as Record<number, HttpStatus>

/**
 * Convert a gRPC error to an HTTP exception.
 */
export function handleGrpcError(err: any): never {
    console.error("🔥 API Gateway nhận lỗi:", JSON.stringify(err, null, 2))

    if (err.code !== undefined && err.details) {
        console.log(`✅ GRPC Error Code: ${err.code}`)

        const statusCode = grpcToHttpStatus[err.code] || HttpStatus.INTERNAL_SERVER_ERROR

        throw new HttpException(
            {
                statusCode,
                message: err.details || 'Unknown error occurred',
            },
            statusCode,
        )
    }

    throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR)
}
