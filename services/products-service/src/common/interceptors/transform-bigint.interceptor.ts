import { CallHandler, ExecutionContext, Injectable, NestInterceptor, } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformBigIntInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => this.transformBigInt(data)),
        );
    }

    private transformBigInt(value: any): any {
        // Convert BigInt value to string
        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (value instanceof Date) {
            return value;
        }

        // Convert BigInt properties in arrays
        if (Array.isArray(value)) {
            return value.map((item) => this.transformBigInt(item));
        }

        // Convert BigInt properties in objects
        if (typeof value === 'object' && value !== null) {
            const transformed = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    transformed[key] = this.transformBigInt(value[key]);
                }
            }
            return transformed;
        }

        return value;
    }
}
