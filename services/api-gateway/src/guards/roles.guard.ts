import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        console.log(requiredRoles);
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.role) {
            throw new ForbiddenException('No user role found');
        }
        if (user.role !== requiredRoles) {
            throw new ForbiddenException('Insufficient role');
        }
        return true;
    }
} 