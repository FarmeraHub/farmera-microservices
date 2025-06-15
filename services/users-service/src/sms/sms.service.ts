import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.warn(
        'Twilio credentials not found. SMS functionality will be disabled.',
      );
      return;
    }

    this.twilioClient = twilio(accountSid, authToken);
  }

  async sendSms(
    to: string,
    message: string,
    fromNumber?: string,
  ): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        this.logger.error('Twilio client not initialized');
        return false;
      }

      const from =
        fromNumber || this.configService.get<string>('TWILIO_PHONE_NUMBER');

      if (!from) {
        this.logger.error('No Twilio phone number configured');
        return false;
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: from,
        to: to,
      });

      this.logger.log(`SMS sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      return false;
    }
  }

  async sendVerificationCode(
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    const message = `Your Farmera verification code is: ${code}. This code will expire in 10 minutes.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendPasswordResetCode(
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    const message = `Your Farmera password reset code is: ${code}. This code will expire in 10 minutes.`;
    return this.sendSms(phoneNumber, message);
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if not present (assuming US +1 for now)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Basic validation - should be at least 10 digits
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}
