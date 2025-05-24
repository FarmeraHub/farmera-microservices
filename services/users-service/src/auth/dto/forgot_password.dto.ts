import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyForgotPasswordDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  code: string;
}

export class UpdateNewPasswordDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  newPassword: string;
}
