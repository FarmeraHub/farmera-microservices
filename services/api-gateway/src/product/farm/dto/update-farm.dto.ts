import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  ValidateNested,
  IsNumberString,
} from 'class-validator';
import { UpdateAddressDto } from './update-address.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFarmDto {
  @ApiPropertyOptional({ description: 'Farm name', example: 'Green Farm ABC' })
  @IsOptional()
  @IsString()
  farm_name?: string;

  @ApiPropertyOptional({
    description: 'Farm description',
    example: 'Organic vegetables farm',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'farm@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '0123456789' })
  @IsOptional()
  @IsNumberString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Tax number', example: '1234567890' })
  @IsOptional()
  @IsString()
  tax_number?: string;

  @ApiPropertyOptional({ description: 'City/Province', example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'District', example: 'Ba Đình' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Ward', example: 'Phúc Xá' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main St',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({
    description: 'Coordinate information',
    example: '21.0285,105.8542',
  })
  @IsOptional()
  @IsString()
  coordinate?: string;

  @ApiPropertyOptional({
    description: 'Profile images',
    example: ['https://example.com/img1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  // @IsUrl({}, { each: true })
  profile_image: string[];

  @ApiPropertyOptional({
    description: 'Certificate images',
    example: ['https://example.com/cert1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  // @IsUrl({}, { each: true })
  certificate_image: string[];
}
