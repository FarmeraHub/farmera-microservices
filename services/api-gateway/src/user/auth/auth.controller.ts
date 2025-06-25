import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService, REFRESH_TOKEN_COOKIES_KEY } from "./auth.service";
import { Public } from "src/common/decorators/public.decorator";
import { ResponseMessage } from "src/common/decorators/response-message.decorator";
import { LoginDto } from "./dto/login.dto";
import { Request, Response } from "express";
import { RegisterDto } from "./dto/register.dto";
import { SendVerificationEmailDto } from "./dto/send-verification-email.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { SendVerificationPhoneDto } from "./dto/send-verification-phone.dto";
import { UpdateNewPasswordDto } from "./dto/update-new-password.dto";
import { VerifyPhoneDto } from "./dto/verify-phone.dto";
import { User } from '../../common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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

  @Public()
  @Post('send-verification-phone')
  @ResponseMessage('Verification SMS sent')
  @ApiOperation({ summary: 'Send phone verification code via SMS' })
  @ApiBody({ type: SendVerificationPhoneDto })
  @ApiResponse({
    status: 200,
    description: 'Verification SMS sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  async sendVerificationPhone(@Body() req: SendVerificationPhoneDto) {
    return await this.authService.sendVerificationPhone(req);
  }

  @Public()
  @Post('verify-phone')
  @ResponseMessage('Phone verified successfully')
  @ApiOperation({ summary: 'Verify phone with SMS code' })
  @ApiBody({ type: VerifyPhoneDto })
  @ApiResponse({
    status: 200,
    description: 'Phone verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            phone: { type: 'string' },
            verified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verifyPhone(@Body() req: VerifyPhoneDto) {
    return await this.authService.verifyPhone(req);
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
