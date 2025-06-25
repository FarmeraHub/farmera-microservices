import { HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export class ErrorMapper {

    private static readonly logger = new Logger(ErrorMapper.name);

    static toRpcException(exception: any): RpcException {
        if (exception instanceof HttpException) {
            const message = exception.message || 'HTTP Error';
            const statusCode = exception.getStatus();

            let grpcCode: number;

            switch (statusCode) {
                case 400:
                    grpcCode = status.INVALID_ARGUMENT;
                    break;
                case 401:
                    grpcCode = status.UNAUTHENTICATED;
                    break;
                case 403:
                    grpcCode = status.PERMISSION_DENIED;
                    break;
                case 404:
                    grpcCode = status.NOT_FOUND;
                    break;
                case 409:
                    grpcCode = status.ALREADY_EXISTS;
                    break;
                case 504:
                    grpcCode = status.DEADLINE_EXCEEDED;
                    break;
                case 503:
                    grpcCode = status.UNAVAILABLE;
                    break;
                case 500:
                    grpcCode = status.INTERNAL;
                    break;
                default:
                    grpcCode = status.UNKNOWN;
                    break;
            }

            return new RpcException({
                code: grpcCode,
                message,
            });
        }
        this.logger.error(`Error in ErrorMapper: ${exception?.message}`);
        return new RpcException({
            code: status.INTERNAL,
            message: "Internal Server Error",
        });
    }
}