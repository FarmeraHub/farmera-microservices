import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name associated with this address (e.g., recipient name)',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '+84901234567',
    description: 'Phone number for this address',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'Ho Chi Minh City',
    description: 'City name',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    example: 'District 1',
    description: 'District name',
    required: false,
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    example: 'Ward 1',
    description: 'Ward name',
    required: false,
  })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({
    example: 'Nguyen Hue Street',
    description: 'Street name',
    required: false,
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({
    example: '123 Nguyen Hue Street, Building A, Floor 5',
    description: 'Complete address line',
  })
  @IsNotEmpty()
  @IsString()
  address_line: string;

  @ApiProperty({
    example: 'home',
    description: 'Address type (home, work, shipping, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the primary address',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @ApiProperty({
    example: 10.762622,
    description: 'Latitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: 106.660172,
    description: 'Longitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: 'VN',
    description: 'Country code',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: '700000',
    description: 'Postal/ZIP code',
    required: false,
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({
    example: 'Quận 1',
    description: 'State or province',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;
}
