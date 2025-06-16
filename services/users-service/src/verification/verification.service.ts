import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from 'src/email/email.service';
import { SmsService } from 'src/sms/sms.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateVerificationDto,
  CreatePhoneVerificationDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto/create-verification.dto';
import { Verification } from './entities/verification.entity';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async create(
    createVerificationDto: CreateVerificationDto,
    forgotPassword = false,
  ) {
    const foundUser = await this.userRepository.findOne({
      where: { email: createVerificationDto.email },
    });

    if (!forgotPassword && foundUser) {
      throw new ConflictException('This email is already in use');
    }

    if (forgotPassword && !foundUser) {
      throw new BadRequestException('User not found');
    }

    const foundVerification = await this.verificationRepository.findOne({
      where: { email: createVerificationDto.email },
    });

    if (foundVerification) {
      if (foundVerification.email_code_count >= 5) {
        throw new BadRequestException(
          'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Valo team',
        );
      }

      foundVerification.email_code = this.generateFourDigitCode();
      foundVerification.email_code_count += 1;
      foundVerification.updated_at = new Date();

      await this.verificationRepository.save(foundVerification);

      setTimeout(async () => {
        await this.sendEmailCode(
          createVerificationDto.email,
          foundVerification.email_code,
        );
      }, 0);
    } else {
      const newVerification = this.verificationRepository.create({
        ...createVerificationDto,
        email_code: this.generateFourDigitCode(),
        email_code_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await this.verificationRepository.save(newVerification);

      setTimeout(async () => {
        if (!forgotPassword) {
          await this.sendEmailCode(
            createVerificationDto.email,
            newVerification.email_code,
          );
        } else {
          await this.sendEmailResetCode(
            createVerificationDto.email,
            newVerification.email_code,
          );
        }
      }, 0);
    }

    return {
      result: 'Success',
    };
  }

  async verifyCode(verifyEmailDto: VerifyEmailDto) {
    const foundVerification = await this.verificationRepository.findOne({
      where: { email: verifyEmailDto.email },
    });

    if (!foundVerification) {
      throw new BadRequestException('Verification not found for this email');
    }

    if (foundVerification.email_code !== verifyEmailDto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    return {
      result: 'Success',
    };
  }

  async sendEmailCode(email: string, code: string) {
    const subject = 'Your Verification Code';
    const text = `Hi,

Please use the code below to verify your email:
${code}

Please let us know if you have any questions or need assistance at support@farmeravietnam.com.

Best regards,
Farmera Team`;

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="text-align: center; color: #034460;">Email Verification</h2>
    <p>Hi,</p>
    <p>Please use the code below to verify your email:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; color: #333; background-color: #f9f9f9; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;">${code}</span>
    </div>
    <p>Please let us know if you have any questions or need assistance at support@farmeravietnam.com.</p>
    <p style="text-align: right;">Best regards,<br>Farmera Team</p>
  </div>
</div>
`;

    await this.emailService.sendEmail(email, subject, text, html);
  }

  async sendEmailResetCode(email: string, code: string) {
    const subject = 'Your Password Reset Code';
    const text = `Hi,

Please use the code below to reset your password:
${code}

Please let us know if you have any questions or need assistance at support@farmeravietnam.com.

Best regards,
Farmera Team`;

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="text-align: center; color: #034460;">Password Reset</h2>
    <p>Hi,</p>
    <p>Please use the code below to reset your password:</p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 24px; font-weight: bold; color: #333; background-color: #f9f9f9; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px;">${code}</span>
    </div>
    <p>Please let us know if you have any questions or need assistance at support@farmeravietnam.com.</p>
    <p style="text-align: right;">Best regards,<br>Farmera Team</p>
  </div>
</div>
`;

    await this.emailService.sendEmail(email, subject, text, html);
  }

  async deleteVerification(email: string) {
    await this.verificationRepository.delete({ email });
  }

  async deleteAllVerifications() {
    await this.verificationRepository.delete({});
  }

  async createPhoneVerification(
    createPhoneVerificationDto: CreatePhoneVerificationDto,
    forgotPassword = false,
  ) {
    const formattedPhone = this.smsService.formatPhoneNumber(
      createPhoneVerificationDto.phone,
    );

    if (!this.smsService.validatePhoneNumber(formattedPhone)) {
      throw new BadRequestException('Invalid phone number format');
    }

    const foundUser = await this.userRepository.findOne({
      where: { phone: formattedPhone },
    });

    if (!forgotPassword && foundUser) {
      throw new ConflictException('This phone number is already in use');
    }

    if (forgotPassword && !foundUser) {
      throw new BadRequestException('User not found');
    }

    const foundVerification = await this.verificationRepository.findOne({
      where: { phone: formattedPhone },
    });

    if (foundVerification) {
      if (foundVerification.phone_code_count >= 5) {
        throw new BadRequestException(
          'You have reached the maximum verification code sent limit, please try again tomorrow or contact the Farmera team',
        );
      }

      foundVerification.phone_code = this.generateFourDigitCode();
      foundVerification.phone_code_count += 1;
      foundVerification.updated_at = new Date();

      await this.verificationRepository.save(foundVerification);

      setTimeout(async () => {
        if (!forgotPassword) {
          await this.sendPhoneCode(
            formattedPhone,
            foundVerification.phone_code,
          );
        } else {
          await this.sendPhoneResetCode(
            formattedPhone,
            foundVerification.phone_code,
          );
        }
      }, 0);
    } else {
      const newVerification = this.verificationRepository.create({
        phone: formattedPhone,
        email: '', // Required field, use empty string for phone-only verification
        email_code: this.generateFourDigitCode(), // Required field
        email_code_count: 0,
        phone_code: this.generateFourDigitCode(),
        phone_code_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await this.verificationRepository.save(newVerification);

      setTimeout(async () => {
        if (!forgotPassword) {
          await this.sendPhoneCode(formattedPhone, newVerification.phone_code);
        } else {
          await this.sendPhoneResetCode(
            formattedPhone,
            newVerification.phone_code,
          );
        }
      }, 0);
    }

    return {
      result: 'Success',
    };
  }

  async verifyPhoneCode(verifyPhoneDto: VerifyPhoneDto) {
    const formattedPhone = this.smsService.formatPhoneNumber(
      verifyPhoneDto.phone,
    );

    const foundVerification = await this.verificationRepository.findOne({
      where: { phone: formattedPhone },
    });

    if (!foundVerification) {
      throw new BadRequestException(
        'Verification not found for this phone number',
      );
    }

    if (foundVerification.phone_code !== verifyPhoneDto.code) {
      throw new BadRequestException('Invalid verification code');
    }

    return {
      result: 'Success',
    };
  }

  async sendPhoneCode(phoneNumber: string, code: string) {
    try {
      await this.smsService.sendVerificationCode(phoneNumber, code);
    } catch (error) {
      throw new BadRequestException('Failed to send SMS verification code');
    }
  }

  async sendPhoneResetCode(phoneNumber: string, code: string) {
    try {
      await this.smsService.sendPasswordResetCode(phoneNumber, code);
    } catch (error) {
      throw new BadRequestException('Failed to send SMS reset code');
    }
  }

  async deletePhoneVerification(phoneNumber: string) {
    const formattedPhone = this.smsService.formatPhoneNumber(phoneNumber);
    await this.verificationRepository.delete({ phone: formattedPhone });
  }

  generateFourDigitCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}
