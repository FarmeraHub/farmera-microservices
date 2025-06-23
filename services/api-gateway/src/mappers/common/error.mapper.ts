import { BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException, InternalServerErrorException, GatewayTimeoutException, ServiceUnavailableException, HttpException } from '@nestjs/common';

interface GrpcError extends Error {
    code?: number;
    details?: string;
    metadata?: any;
}

export class ErrorMapper {
    static fromGrpcError(error: GrpcError): HttpException {
        const message = error.details || error.message || 'gRPC Error';

        switch (error.code) {
            case 3: // INVALID_ARGUMENT
                return new BadRequestException(message);
            case 16: // UNAUTHENTICATED
                return new UnauthorizedException(message);
            case 7: // PERMISSION_DENIED
                return new ForbiddenException(message);
            case 5: // NOT_FOUND
                return new NotFoundException(message);
            case 6: // ALREADY_EXISTS
                return new ConflictException(message);
            case 14: // UNAVAILABLE
                return new ServiceUnavailableException(message);
            case 4: // DEADLINE_EXCEEDED
                return new GatewayTimeoutException(message);
            case 13: // INTERNAL
            case 2:  // UNKNOWN
            default:
                return new InternalServerErrorException(message);
        }
    }

}