import { ArgumentsHost, Catch, ExceptionFilter, HttpException, UnauthorizedException, NotFoundException, ConflictException, HttpStatus, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { response } from 'express';


Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(RpcToHttpExceptionFilter.name);

    catch(exception: RpcException, host: ArgumentsHost) {
       // const ctx = host.switchToRpc(); // ✅ Chuyển sang RPC context (vì đang dùng TCP)
      //  const error: any = exception.message; // Lấy lỗi từ Microservice
        //const error = exception.getError ? exception.getError() : exception.message;
        const error: any = exception.getError ? exception.getError() : exception.message;
        let statusCode = (exception as any).statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
        //console.log("🚀 ~ RpcToHttpExceptionFilter ~ statusCode:", statusCode)
        let message = 'Internal Server Error';
        // ✅ Log lỗi để debug
        this.logger.error(`🚀 Received RpcException from Microservice:`, error);
        // ✅ Nếu error là object có `status` & `message`
        if (typeof error === 'object' && error !== null) {
            statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
            message = error.message || 'Internal Server Error';
        }
        else if (typeof error === 'string') {
            message = error;
        }
        // ✅ Trả về lỗi dạng JSON object cho API Gateway xử lý
        const httpContext = host.switchToHttp();
        if (httpContext.getResponse()) {
       console.log("🚀 ~ htttpsssss ~ Final Response:", { statusCode, message });
            const response = httpContext.getResponse();
            return response.status(statusCode).json({ statusCode, message });
        }
       return { statusCode, message };
    }
}