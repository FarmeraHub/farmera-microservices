import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService, REFRESH_TOKEN_COOKIES_KEY } from './auth.service';
import { Request, Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  UpdateNewPasswordDto,
} from './dto/forgot_password.dto';

// NOTE: Auth endpoints are active for API Gateway to proxy to
// API Gateway will handle centralized auth and proxy to these endpoints
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ResponseMessage('Log in successfully')
  async signIn(
    @Body() req: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.authService.login(req, res);
  }

  @Public()
  @Get('refresh-token')
  @ResponseMessage('Refresh token successfully')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIES_KEY];
    return await this.authService.processNewToken(refreshToken, res);
  }

  @Public()
  @Post('forgot-password')
  @ResponseMessage('Forgot password successfully')
  async forgotPassword(@Body() req: ForgotPasswordDto) {
    return await this.authService.forgotPassword(req);
  }

  @Public()
  @Post('update-new-password')
  @ResponseMessage('Update new password successfully')
  async updateNewPassword(@Body() req: UpdateNewPasswordDto) {
    return await this.authService.updateNewPassword(req);
  }
}
