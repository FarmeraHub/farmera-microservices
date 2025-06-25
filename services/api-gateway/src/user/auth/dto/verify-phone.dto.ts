import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyPhoneDto {
  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number that received the verification code',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: '1234',
    description: 'Verification code received via SMS',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  verification_code: string;
}
