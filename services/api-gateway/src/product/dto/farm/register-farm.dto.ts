import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterFarmDto {
  @ApiProperty({
    description: 'Farm name',
    example: 'Green Valley Farm',
  })
  @IsString()
  @IsNotEmpty()
  farm_name: string;

  @ApiPropertyOptional({
    description: 'Farm description',
    example: 'Organic farming with sustainable practices',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Farm email address',
    example: 'farm@greenvalley.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Farm phone number',
    example: '+84987654321',
  })
  @IsNotEmpty()
  @IsPhoneNumber('VN')
  phone: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  tax_number?: string;

  @ApiProperty({
    description: 'City',
    example: 'Ho Chi Minh City',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'District',
    example: 'District 1',
  })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    description: 'Ward',
    example: 'Ward 1',
  })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Nguyen Hue Street',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'Coordinates (latitude,longitude)',
    example: '10.762622,106.660172',
  })
  @IsString()
  @IsNotEmpty()
  coordinate: string;
}
