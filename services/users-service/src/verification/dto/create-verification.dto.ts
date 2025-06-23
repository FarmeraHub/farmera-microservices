import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';

export class CreateVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class CreatePhoneVerificationDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;
}

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  code: string;
}

export class VerifyPhoneDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  code: string;
}
