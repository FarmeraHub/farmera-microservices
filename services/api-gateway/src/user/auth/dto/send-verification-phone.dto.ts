import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendVerificationPhoneDto {
  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number to send verification code to',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;
}
