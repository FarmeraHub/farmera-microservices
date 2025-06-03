import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { GrpcMethod } from '@nestjs/microservices';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctxHandler = context.getHandler();

    // Check if the endpoint is marked as public
    const isPublic =
      this.reflector.get<boolean>(IS_PUBLIC_KEY, ctxHandler) ?? false;

    // If it's a public route, allow access immediately
    if (isPublic) {
      return true;
    }

    // Check if this is a gRPC method
    const isGrpcMethod = Reflect.getMetadata('grpc_method', ctxHandler);
    if (isGrpcMethod) {
      // For gRPC methods, we don't have HTTP headers
      // You could implement custom gRPC auth here if needed
      return true;
    }

    // For HTTP requests, proceed with token validation
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Please login to access this');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      });
      request.user = payload;
    } catch (e) {
      if (e instanceof ForbiddenException) {
        throw e;
      } else {
        throw new UnauthorizedException('Invalid token');
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
