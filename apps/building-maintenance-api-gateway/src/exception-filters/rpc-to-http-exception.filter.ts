import { ArgumentsHost, Catch, ExceptionFilter, HttpException, UnauthorizedException } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'

@Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
    catch(exception: RpcException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()

        const error: any = exception.getError() // Lấy thông tin lỗi từ Microservice

        // Nếu lỗi là UnauthorizedException, trả về HTTP 401
        if (error instanceof UnauthorizedException) {
            return response.status(401).json({
                statusCode: 401,
                message: 'Unauthorized',
            })
        }

        // Nếu lỗi khác, mặc định trả về 500 hoặc theo mã lỗi từ Microservice
        return response.status(error.status || 500).json({
            statusCode: error.status || 500,
            message: error.message || 'Internal Server Error',
        })
    }
}
