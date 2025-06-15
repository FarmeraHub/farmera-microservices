import {
  BadRequestException,
  HttpException,
  HttpStatus,
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
import {
  ForgotPasswordDto,
  UpdateNewPasswordDto,
  LoginDto,
  RegisterDto,
  SendVerificationEmailDto,
  VerifyEmailDto,
  SendVerificationPhoneDto,
  VerifyPhoneDto,
} from './dto';
import { ClientGrpc } from '@nestjs/microservices';
import { HashService } from '../services/hash.service';
import { Observable } from 'rxjs';

export const REFRESH_TOKEN_COOKIES_KEY = 'refresh_token';

// gRPC response interfaces
interface LoginResponse {
  user: any;
  token_info: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  requires_verification: boolean;
  verification_type: string;
}

interface RefreshTokenResponse {
  token_info: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  requires_relogin: boolean;
}

interface LogoutResponse {
  success: boolean;
}

interface CreateUserResponse {
  user: any;
  verification_sent: boolean;
}

interface SendVerificationEmailResponse {
  success: boolean;
  message: string;
}

interface VerifyEmailResponse {
  success: boolean;
  user: any;
}

interface SendVerificationPhoneResponse {
  success: boolean;
  message: string;
}

interface VerifyPhoneResponse {
  success: boolean;
  user?: any;
}

// gRPC service interface
interface UsersGrpcService {
  login(data: any): Observable<LoginResponse>;
  refreshToken(data: any): Observable<RefreshTokenResponse>;
  forgotPassword(data: any): Observable<ForgotPasswordResponse>;
  updatePassword(data: any): Observable<UpdatePasswordResponse>;
  logout(data: any): Observable<LogoutResponse>;
  createUser(data: any): Observable<CreateUserResponse>;
  sendVerificationEmail(data: any): Observable<SendVerificationEmailResponse>;
  verifyEmail(data: any): Observable<VerifyEmailResponse>;
  sendVerificationPhone(data: any): Observable<SendVerificationPhoneResponse>;
  verifyPhone(data: any): Observable<VerifyPhoneResponse>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private usersGrpcService: UsersGrpcService;

  constructor(
    @Inject('USERS_GRPC_PACKAGE') private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
  ) {}

  onModuleInit() {
    this.usersGrpcService =
      this.client.getService<UsersGrpcService>('UsersService');
  }

  async login(req: LoginDto, res: Response) {
    try {
      this.logger.log(`Attempting login for email: ${req.email}`);

      const result = await firstValueFrom(
        this.usersGrpcService.login({
          email: req.email,
          password: req.password,
          remember_me: false,
          device_info: 'API Gateway',
        }),
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
          user: result.user,
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

      const result = await firstValueFrom(
        this.usersGrpcService.refreshToken({
          refresh_token: refreshToken,
        }),
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

      const result = await firstValueFrom(
        this.usersGrpcService.forgotPassword({
          email: req.email,
        }),
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

      const result = await firstValueFrom(
        this.usersGrpcService.updatePassword({
          email: req.email,
          new_password: req.newPassword,
          reset_token: req.verification_code,
        }),
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

      const result = await firstValueFrom(
        this.usersGrpcService.logout({
          user_id: '', // Will be resolved by users service using the token
          device_id: 'API Gateway',
        }),
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

      console.log(req);

      const result = await firstValueFrom(
        this.usersGrpcService.createUser({
          email: req.email,
          password: req.password,
          first_name: req.first_name,
          last_name: req.last_name,
          verification_code: req.verification_code,
        }),
      );

      if (result.user) {
        this.logger.log(`Registration successful for user: ${result.user.id}`);
        return {
          user: result.user,
          verification_sent: result.verification_sent,
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

      const result = await firstValueFrom(
        this.usersGrpcService.sendVerificationEmail({
          email: req.email,
        }),
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

      const result = await firstValueFrom(
        this.usersGrpcService.verifyEmail({
          email: req.email,
          verification_code: req.verification_code,
        }),
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

      const result = await firstValueFrom(
        this.usersGrpcService.sendVerificationPhone({
          phone: req.phone,
        }),
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

      const result = await firstValueFrom(
        this.usersGrpcService.verifyPhone({
          phone: req.phone,
          verification_code: req.verification_code,
        }),
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
