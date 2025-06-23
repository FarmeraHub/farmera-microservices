import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateNewPasswordDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Reset code received via email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  verification_code: string;

  @ApiProperty({
    description: 'New password',
    example: 'newSecurePassword123',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
}
