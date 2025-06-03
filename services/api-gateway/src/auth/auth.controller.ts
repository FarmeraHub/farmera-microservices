import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Param,
  Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService, REFRESH_TOKEN_COOKIES_KEY } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import {
  LoginDto,
  ForgotPasswordDto,
  UpdateNewPasswordDto,
  RegisterDto,
  VerifyEmailDto,
  SendVerificationEmailDto,
} from './dto';
import { User } from '../common/decorators/user.decorator';
import { User as UserInterface } from '../common/interfaces/user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(
    @Body() req: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.login(req, res);
  }

  @Public()
  @Post('register')
  @ResponseMessage('User registered successfully')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
          },
        },
        verification_sent: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data or email already exists',
  })
  async register(@Body() req: RegisterDto) {
    return await this.authService.register(req);
  }

  @Public()
  @Post('send-verification-email')
  @ResponseMessage('Verification email sent')
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiBody({ type: SendVerificationEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async sendVerificationEmail(@Body() req: SendVerificationEmailDto) {
    return await this.authService.sendVerificationEmail(req);
  }

  @Public()
  @Post('verify-email')
  @ResponseMessage('Email verified successfully')
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            verified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifyEmail(@Body() req: VerifyEmailDto) {
    return await this.authService.verifyEmail(req);
  }

  @Get('profile')
  @ResponseMessage('User profile retrieved successfully')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            total_orders: { type: 'number' },
            total_reviews: { type: 'number' },
            loyalty_points: { type: 'number' },
            member_since: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProfile(@User() user: UserInterface) {
    return await this.authService.getUserProfile(user.id);
  }

  @Public()
  @Get('refresh-token')
  @ResponseMessage('Token refreshed successfully')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIES_KEY];
    return await this.authService.refreshToken(refreshToken, res);
  }

  @Public()
  @Post('forgot-password')
  @ResponseMessage('Password reset email sent')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async forgotPassword(@Body() req: ForgotPasswordDto) {
    return await this.authService.forgotPassword(req);
  }

  @Public()
  @Post('update-new-password')
  @ResponseMessage('Password updated successfully')
  @ApiOperation({ summary: 'Update password with reset code' })
  @ApiBody({ type: UpdateNewPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        requires_relogin: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid reset code or password' })
  async updateNewPassword(@Body() req: UpdateNewPasswordDto) {
    return await this.authService.updateNewPassword(req);
  }

  @Public()
  @Post('logout')
  @ResponseMessage('Logout successful')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    return await this.authService.logout(res);
  }
}
