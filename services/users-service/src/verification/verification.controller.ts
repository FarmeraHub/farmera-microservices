import { Body, Controller, Post } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Public } from 'src/decorators/public.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import {
  CreateVerificationDto,
  VerifyEmailDto,
} from './dto/create-verification.dto';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @ResponseMessage('Verification code sent successfully')
  @Post('email')
  create(@Body() createVerificationDto: CreateVerificationDto) {
    return this.verificationService.create(createVerificationDto);
  }

  @Public()
  @ResponseMessage('Verify email successfully')
  @Post('email/verify')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.verificationService.verifyCode(verifyEmailDto);
  }

  @Cron('0 0 * * *')
  async handleCron() {
    await this.verificationService.deleteAllVerifications();
  }
}
