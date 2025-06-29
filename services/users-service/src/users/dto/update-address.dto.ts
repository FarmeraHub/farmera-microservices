import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAddressDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Name associated with this address',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number for this address',
  })
  @IsString()
  phone: string;
  
  @ApiProperty({
    example: 'Ho Chi Minh City',
    description: 'City name',
  })
  @IsString()
  city: string;

  @ApiProperty({
    example: 'District 1',
    description: 'District name',
  })
  @IsString()
  district: string;

  @ApiProperty({
    example: 'Ward 1',
    description: 'Ward name',
  })
  @IsString()
  ward: string;

  @ApiProperty({
    example: 'Nguyen Hue Street',
    description: 'Street name',
  })
  @IsString()
  street: string;

  @ApiProperty({
    example: '123 Nguyen Hue Street, Building A, Floor 5',
    description: 'Complete address line',
  })
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
}
