import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import  ms from 'ms';
import { UserStatus } from 'src/enums/status.enum';
import { HashService } from 'src/services/hash.service';
import { User } from 'src/users/entities/user.entity';
import { VerificationService } from 'src/verification/verification.service';
import { Repository } from 'typeorm';
import {
  ForgotPasswordDto,
  UpdateNewPasswordDto,
} from './dto/forgot_password.dto';
import { LoginDto } from './dto/login.dto';
export const REFRESH_TOKEN_COOKIES_KEY = 'refresh_token';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly verificationService: VerificationService,
  ) {}

  async login(req: LoginDto, res: Response) {
    const result = await this.validateUser(req.email, req.password);

    if (result) {
      const { id, email, first_name, last_name, phone, role, status, avatar } =
        result;

      if (status === UserStatus.BANNED) {
        throw new UnauthorizedException('Your account is banned');
      }

      const payload = {
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        status,
        avatar,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_TOKEN_EXPIRATION',
        ),
      });

      const refreshToken = await this.createRefreshToken({
        ...payload,
        sub: 'token refresh',
        iss: 'from server',
      });

      // Only set cookies if we're in an HTTP context (res.cookie exists)
      if (res && typeof res.cookie === 'function') {
        const expirationSetting = this.configService.get<string>(
          'JWT_REFRESH_TOKEN_EXPIRATION',
          '7d', // Default value if the env var is not set
        );
        res.cookie(REFRESH_TOKEN_COOKIES_KEY, refreshToken, {
          httpOnly: false,
          maxAge: ms(expirationSetting as ms.StringValue),
          sameSite: 'none',
          secure: true,
        });
      }

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          status,
          avatar,
        },
      };
    }
    return null;
  }

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (
        user &&
        user.hashed_pwd &&
        (await this.hashService.comparePassword(password, user.hashed_pwd))
      ) {
        return user;
      }

      throw new HttpException(
        'Invalid email or password',
        HttpStatus.BAD_REQUEST,
      );
    } catch (error) {
      throw new HttpException(
        error.response || 'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processNewToken(refreshToken: string, res: Response) {
    try {
      const userDecoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: userDecoded.id },
      });

      if (user) {
        const payload = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
        };

        const newAccessToken = this.jwtService.sign(payload, {
          secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: this.configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION',
          ),
        });

        const newRefreshToken = await this.createRefreshToken({
          ...payload,
          sub: 'token refresh',
          iss: 'from server',
        });

        // Only manipulate cookies if we're in an HTTP context (res.cookie exists)
        if (res && typeof res.cookie === 'function') {
          res.clearCookie(REFRESH_TOKEN_COOKIES_KEY);

          const expirationSetting = this.configService.get<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION',
            '7d', // Default value if the env var is not set
          );

          res.cookie(REFRESH_TOKEN_COOKIES_KEY, newRefreshToken, {
            httpOnly: false, // Consider setting this to true for refresh tokens if possible
            maxAge: ms(expirationSetting as ms.StringValue), // Type assertion here
            sameSite: 'none',
            secure: true,
          });
        }

        return {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: user.role,
            status: user.status,
            avatar: user.avatar,
          },
        };
      } else {
        throw new BadRequestException('Refresh token is invalid or expired');
      }
    } catch (error) {
      throw new BadRequestException(
        'Refresh token is not valid or expire. Please sign in.',
      );
    }
  }

  private isAccessTokenExpired(err: any, user: any): boolean {
    return Boolean(err) || !user;
  }

  private isRefreshTokenAvailable(request: Request): boolean {
    return Boolean(request.cookies?.[REFRESH_TOKEN_COOKIES_KEY]);
  }

  async createRefreshToken(
    payload: Record<
      string,
      string | number | boolean | object | undefined | null | Array<any>
    >,
  ) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION'),
    });

    return refreshToken;
  }

  public handleAuthErrors(err: any, user: any, request: Request): void {
    if (
      this.isAccessTokenExpired(err, user) &&
      this.isRefreshTokenAvailable(request)
    ) {
      const userDecode = this.jwtService.verify(
        request.cookies?.[REFRESH_TOKEN_COOKIES_KEY],
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        },
      );
      return userDecode;
      // throw new TokenExpiredException();
    } else if (
      this.isAccessTokenExpired(err, user) &&
      !this.isRefreshTokenAvailable(request)
    ) {
      throw new UnauthorizedException('Please login');
    }
  }

  async forgotPassword(req: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: req.email },
    });

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    await this.verificationService.create({ email: req.email }, true);
  }

  async updateNewPassword(req: UpdateNewPasswordDto) {
    const verification = await this.verificationService.verifyCode({
      email: req.email,
      code: req.code,
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.verificationService.deleteVerification(req.email);

    await this.userRepository.update(
      { email: req.email },
      {
        hashed_pwd: await this.hashService.hashPassword(req.newPassword),
      },
    );

    return {
      result: 'Success',
    };
  }
}
