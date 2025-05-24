import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as sanitize from 'express-mongo-sanitize';
import { sanitizeString } from 'src/helpers/sanitizeString.helper';

const sanitizeData = (data: any) => {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  if (!data || typeof data !== 'object') return data;
  return sanitize.sanitize(JSON.parse(JSON.stringify(data)), {
    allowDots: false,
    onSanitize: ({ key }) => console.warn(`Sanitized: ${key}`),
  });
};

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && Object.keys(request.body).length) {
      Object.assign(request.body, sanitizeData(request.body));
    }
    if (request.query && Object.keys(request.query).length) {
      Object.assign(request.query, sanitizeData(request.query));
    }
    if (request.params && Object.keys(request.params).length) {
      Object.assign(request.params, sanitizeData(request.params));
    }

    return next.handle();
  }
}
