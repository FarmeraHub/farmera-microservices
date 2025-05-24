import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district: string;

  @IsOptional()
  @IsString()
  ward: string;

  @IsOptional()
  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  coordinate: string;
}