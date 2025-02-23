import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

interface ExceptionResponse {
    statusCode: number
    message: string | string[]
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        const exceptionResponse = exception.getResponse() as ExceptionResponse
        const status = exceptionResponse?.statusCode ?? 500
        const message = exceptionResponse?.message ?? 'Internal Server Error'

        response.status(status).json({
            statusCode: status,
            message: message,
        })
    }
}
