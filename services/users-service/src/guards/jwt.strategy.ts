import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserRole } from 'src/enums/roles.enum';
import { UserStatus } from 'src/enums/status.enum';
import { User } from 'src/users/entities/user.entity';

export const cacheUserKey = 'USER';

export type JwtDecoded = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  //farm_id?: number;
  avatar?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    readonly configService: ConfigService,
    private readonly userService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_TOKEN_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtDecoded) {
    const userId = payload.id;

    let cachedUser = await this.cacheManager.get<User>(cacheUserKey);
    if (cachedUser && cachedUser.email !== payload.email) {
      cachedUser = null;
    }
    if (!cachedUser) {
      cachedUser = await this.userService.getUserById(userId);
      if (!cachedUser) {
        throw new UnauthorizedException('User not found');
      }
      await this.cacheManager.set(cacheUserKey, cachedUser, 0);
    }

    if (cachedUser.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your account is not active');
    }
    cachedUser.id = userId as any;

    return cachedUser;
  }
}
