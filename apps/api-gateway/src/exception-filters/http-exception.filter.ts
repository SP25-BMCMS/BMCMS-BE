import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

interface ExceptionResponse {
    statusCode: number
    message: string | string[]
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        console.log("🚀 Kha ne ~ exception:", exception)
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const exceptionResponse = exception.getResponse() as ExceptionResponse
        const status = exceptionResponse?.statusCode ?? 500
        const message = exceptionResponse?.message ?? 'Internal Server Error'
        console.log("🚀 ~ HttpExceptionFilter ~ message:", message)
        console.log("🚀 ~ HttpExceptionFilter ~ status:", status)

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
        })
    }
}
