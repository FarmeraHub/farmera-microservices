import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@farmera.com',
    description: 'Email address to send password reset to',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyForgotPasswordDto {
  @ApiProperty({
    example: 'user@farmera.com',
    description: 'Email address',
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code from email',
  })
  @IsNotEmpty()
  code: string;
}

export class UpdateNewPasswordDto {
  @ApiProperty({
    example: 'user@farmera.com',
    description: 'Email address',
  })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Verification code from email',
  })
  @IsNotEmpty()
  verification_code: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password to set',
  })
  @IsNotEmpty()
  newPassword: string;
}
