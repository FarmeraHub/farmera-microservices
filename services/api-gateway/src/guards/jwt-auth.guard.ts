import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { IS_SYSTEM_AUTH_KEY } from '../common/decorators/system-auth.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isSystemAuth = this.reflector.getAllAndOverride<boolean>(IS_SYSTEM_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Skip authentication for public routes
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    // For system auth endpoints, validate system bearer token
    if (isSystemAuth) {
      return await this.handleSystemAuth(request, token);
    }

    // Standard JWT authentication for other endpoints
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      });

      // Attach user payload to request for downstream use
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private async handleSystemAuth(request: Request, token?: string): Promise<boolean> {
    if (!token) {
      throw new UnauthorizedException('System token required');
    }

    // Validate system bearer token
    if (this.validateSystemToken(token)) {
      request['system'] = true;
      return true;
    }

    throw new UnauthorizedException('Invalid system token');
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private validateSystemToken(token: string): boolean {
    // Validate system token against environment variable
    const validSystemToken = process.env.SYSTEM_BEARER_TOKEN;
    return token === validSystemToken;
  }
}
