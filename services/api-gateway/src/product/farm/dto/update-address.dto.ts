import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiPropertyOptional({ description: 'City name', example: 'Hanoi' })
  @IsOptional()
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'District name', example: 'Ba Dinh' })
  @IsOptional()
  @IsString()
  district: string;

  @ApiPropertyOptional({ description: 'Ward name', example: 'Phuc Xa' })
  @IsOptional()
  @IsString()
  ward: string;

  @ApiPropertyOptional({ description: 'Street name', example: '123 Nguyen Chi Thanh' })
  @IsOptional()
  @IsString()
  street: string;

  @ApiPropertyOptional({ description: 'Coordinates in "lat,lng" format', example: '21.0285,105.8542' })
  @IsOptional()
  @IsString()
  coordinate: string;
}