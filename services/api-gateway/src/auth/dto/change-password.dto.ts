import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current password',
  })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: 'newPassword456!',
    description:
      'New password (minimum 8 characters, must contain at least one letter, one number)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}
