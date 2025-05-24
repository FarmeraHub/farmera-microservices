import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpStatus,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  export interface Response<T> {
    statusCode: number;
    message?: string;
    data: T;
  }
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Observable<Response<T>> {
      const ctx = context.switchToHttp();
      const response = ctx.getResponse(); 
  
      return next.handle().pipe(
        map((data) => ({
          statusCode: response.statusCode || HttpStatus.OK, 
          message: data?.message || 'Success', 
          data: data?.data !== undefined ? data.data : data,
        })),
      );
    }
  }