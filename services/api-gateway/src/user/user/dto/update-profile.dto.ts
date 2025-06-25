import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Gender } from 'src/common/enums/user/gender.enum';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John',
    description: 'First name',
    required: false,
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
    required: false,
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({
    example: 'GENDER_MALE',
    description: 'Gender',
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Birthday in ISO date format',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}
