import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'

@Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
    catch(exception: RpcException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()
        const request = ctx.getRequest<Request>()
        // Lấy thông tin lỗi từ RpcException
        const errorResponse: any = exception.getError()
        console.log("🚀 Kha ne ~ errorResponse:", errorResponse)


        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let message = 'Internal Server Error'

        if (typeof errorResponse === 'object' && errorResponse !== null) {
            status = errorResponse.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
            message = errorResponse.message || 'Unexpected Error'
        } else if (typeof errorResponse === 'string') {
            message = errorResponse
        }

        response.status(status).json({
            message,
            statusCode: status,
            path: request.url,
            timestamp: new Date().toISOString(),
        })
    }
}
