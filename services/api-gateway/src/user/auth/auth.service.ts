import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import ms from 'ms';
import { firstValueFrom } from 'rxjs';
import { ClientGrpc } from '@nestjs/microservices';
import {
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  UpdatePasswordRequest,
  LogoutRequest,
  CreateUserRequest,
  SendVerificationEmailRequest,
  VerifyEmailRequest,
  SendVerificationPhoneRequest,
  VerifyPhoneRequest,
  UsersServiceClient,
} from '@farmera/grpc-proto/dist/users/users';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendVerificationEmailDto } from './dto/send-verification-email.dto';
import { SendVerificationPhoneDto } from './dto/send-verification-phone.dto';
import { UpdateNewPasswordDto } from './dto/update-new-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { UserMapper } from 'src/mappers/users/user.mapper';

export const REFRESH_TOKEN_COOKIES_KEY = 'refresh_token';
export const ACCESS_TOKEN_COOKIES_KEY = 'access_token';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private usersGrpcService: UsersServiceClient;

  constructor(
    @Inject('USERS_GRPC_PACKAGE') private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  onModuleInit() {
    this.usersGrpcService =
      this.client.getService<UsersServiceClient>('UsersService');
  }

  async login(req: LoginDto, res: Response) {
    try {
      this.logger.log(`Attempting login for email: ${req.email}`);

      const grpcRequest: LoginRequest = {
        email: req.email,
        password: req.password,
        remember_me: false,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.login(grpcRequest),
      );

      if (result.user && result.token_info) {
        this.logger.log(`Login successful for user: ${result.user.id}`);
        const { access_token, refresh_token, expires_in } = result.token_info;

        // Set refresh token cookie (same as users-service)
        const refreshTokenExpiresIn = ms('7d');
        res.cookie(REFRESH_TOKEN_COOKIES_KEY, refresh_token, {
          httpOnly: true,
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          maxAge: refreshTokenExpiresIn,
          sameSite: 'strict',
        });

        return {
          user: UserMapper.fromGrpcUser(result.user),
          access_token,
          refresh_token,
          expires_in,
        };
      }

      throw new UnauthorizedException('Invalid credentials');
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('credentials') || error.code === 16) {
        throw new UnauthorizedException(error.details || 'Invalid credentials');
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(error.details || 'Login failed');
    }
  }

  async refreshToken(refreshToken: string, res: Response) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not provided');
      }

      this.logger.log('Processing refresh token request');

      const grpcRequest: RefreshTokenRequest = {
        refresh_token: refreshToken,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.refreshToken(grpcRequest),
      );

      if (result.token_info) {
        this.logger.log('Refresh token successful');
        const {
          access_token,
          refresh_token: newRefreshToken,
          expires_in,
        } = result.token_info;

        // Clear old cookie and set new one
        res.clearCookie(REFRESH_TOKEN_COOKIES_KEY);
        const refreshTokenExpiresIn = ms('7d');
        res.cookie(REFRESH_TOKEN_COOKIES_KEY, newRefreshToken, {
          httpOnly: true,
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          maxAge: refreshTokenExpiresIn,
          sameSite: 'strict',
        });

        return {
          access_token,
          refresh_token: newRefreshToken,
          expires_in,
        };
      }

      throw new UnauthorizedException('Failed to refresh token');
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('token') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'Invalid refresh token',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(error.details || 'Failed to refresh token');
    }
  }

  async forgotPassword(req: ForgotPasswordDto) {
    try {
      this.logger.log(`Processing forgot password for email: ${req.email}`);

      const grpcRequest: ForgotPasswordRequest = {
        email: req.email,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.forgotPassword(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Forgot password email sent successfully');
        return {
          message: result.message || 'Password reset email sent',
        };
      }

      throw new Error('Failed to send password reset email');
    } catch (error) {
      this.logger.error(`Forgot password failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to send password reset email',
      );
    }
  }

  async updateNewPassword(req: UpdateNewPasswordDto) {
    try {
      this.logger.log(`Processing password update for email: ${req.email}`);

      const grpcRequest: UpdatePasswordRequest = {
        email: req.email,
        new_password: req.newPassword,
        code: req.verification_code,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.updatePassword(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Password updated successfully');
        return {
          message: 'Password updated successfully',
          requires_relogin: result.requires_relogin,
        };
      }

      throw new Error('Failed to update password');
    } catch (error) {
      this.logger.error(`Update password failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to update password',
      );
    }
  }

  async logout(res: Response) {
    try {
      this.logger.log('Processing logout');

      // Clear the refresh token cookie
      res.clearCookie(REFRESH_TOKEN_COOKIES_KEY);
      res.clearCookie(ACCESS_TOKEN_COOKIES_KEY);

      const grpcRequest: LogoutRequest = {
        user_id: '', // Will be resolved by users service using the token
        device_id: 'API Gateway',
      };

      const result = await firstValueFrom(
        this.usersGrpcService.logout(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Logout successful');
        return { message: 'Logout successful' };
      }

      throw new Error('Failed to logout');
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(error.details || 'Failed to logout');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      // Verify and decode the JWT token
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  async register(req: RegisterDto) {
    try {
      this.logger.log(`Processing registration for email: ${req.email}`);

      // Validate required fields
      if (!req.email || !req.password || !req.first_name || !req.last_name) {
        throw new BadRequestException('All fields are required');
      }

      const grpcRequest: CreateUserRequest = {
        email: req.email,
        password: req.password,
        first_name: req.first_name,
        last_name: req.last_name,
        verification_code: req.verification_code,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.createUser(grpcRequest),
      );

      if (result.user) {
        this.logger.log(`Registration successful for user: ${result.user.id}`);
        return {
          user: UserMapper.fromGrpcUser(result.user),
          verification_sent: true, // Assume verification was sent
        };
      }

      throw new Error('Failed to register user');
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);

      throw new BadRequestException(error.details || 'Registration failed');
    }
  }

  async sendVerificationEmail(req: SendVerificationEmailDto) {
    try {
      this.logger.log(
        `Processing send verification email request for: ${req.email}`,
      );

      const grpcRequest: SendVerificationEmailRequest = {
        email: req.email,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.sendVerificationEmail(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Verification email sent successfully');
        return {
          success: true,
          message: result.message || 'Verification email sent',
        };
      }

      throw new Error('Failed to send verification email');
    } catch (error) {
      this.logger.error(`Send verification email failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to send verification email',
      );
    }
  }

  async verifyEmail(req: VerifyEmailDto) {
    try {
      this.logger.log(`Processing email verification for: ${req.email}`);

      if (!req.email) {
        throw new BadRequestException('Email is required');
      }

      if (!req.verification_code) {
        throw new BadRequestException('Verification code is required');
      }

      const grpcRequest: VerifyEmailRequest = {
        email: req.email,
        verification_code: req.verification_code,
        verification_token: '', // May not be needed
      };

      const result = await firstValueFrom(
        this.usersGrpcService.verifyEmail(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Email verified successfully');
        return {
          success: true,
        };
      }

      throw new Error('Failed to verify email');
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Email verification failed',
      );
    }
  }

  async sendVerificationPhone(req: SendVerificationPhoneDto) {
    try {
      this.logger.log(
        `Processing send verification phone request for: ${req.phone}`,
      );

      const grpcRequest: SendVerificationPhoneRequest = {
        phone: req.phone,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.sendVerificationPhone(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Verification SMS sent successfully');
        return {
          success: true,
          message: result.message || 'Verification SMS sent',
        };
      }

      throw new Error('Failed to send verification SMS');
    } catch (error) {
      this.logger.error(`Send verification SMS failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to send verification SMS',
      );
    }
  }

  async verifyPhone(req: VerifyPhoneDto) {
    try {
      this.logger.log(`Processing phone verification for: ${req.phone}`);

      if (!req.phone) {
        throw new BadRequestException('Phone number is required');
      }

      if (!req.verification_code) {
        throw new BadRequestException('Verification code is required');
      }

      const grpcRequest: VerifyPhoneRequest = {
        phone: req.phone,
        verification_code: req.verification_code,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.verifyPhone(grpcRequest),
      );

      if (result.success) {
        this.logger.log('Phone verified successfully');
        return {
          success: true,
        };
      }

      throw new Error('Failed to verify phone');
    } catch (error) {
      this.logger.error(`Phone verification failed: ${error.message}`);

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Phone verification failed',
      );
    }
  }
}
