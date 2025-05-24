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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctxHandler = context.getHandler();
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    const isPublic =
      this.reflector.get<boolean>(IS_PUBLIC_KEY, ctxHandler) ?? false;

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_TOKEN_SECRET,
        });
        request.user = payload;
        if (isPublic) {
          return true;
        }
      } catch (e) {
        if (isPublic) {
          // For public routes, ignore token verification errors
          request.user = null;
        } else {
          if (e instanceof ForbiddenException) {
            throw e;
          } else {
            throw new UnauthorizedException('Invalid token');
          }
        }
      }
    } else if (!isPublic) {
      throw new UnauthorizedException('Please login to access this');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
