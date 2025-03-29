import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionResponse {
  statusCode: number;
  message: string | string[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log('exception:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Get the HTTP status from the exception
    const status = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;

    // Get the response object from the exception
    const exceptionResponse = exception.getResponse();

    // Extract the message based on the response type
    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
      // If the response is a string, use it directly
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      // If it's an object, try to extract the message property
      message = (exceptionResponse as any).message || 'Internal Server Error';
    } else {
      // Default message if none is found
      message = 'Internal Server Error';
    }

    console.log('🚀 ~ HttpExceptionFilter ~ message:', message);
    console.log('🚀 ~ HttpExceptionFilter ~ status:', status);

    // Return a properly formatted error response
    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
