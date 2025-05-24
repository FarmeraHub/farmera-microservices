import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response as ExpressResponse } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message || errorResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)} Path: ${request.url}`,
      exception instanceof Error ? exception.stack : ''
    );


    response.status(status).json({
      statusCode: status,
      message: message,
      data: null,
    });
  }
}