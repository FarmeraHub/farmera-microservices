import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from 'class-validator';

export class FarmRegistrationDto {
  @IsString()
  @IsNotEmpty()
  farm_name: string;

  @IsOptional()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  @IsOptional()
  tax_number: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsOptional()
  @Matches(
    /^-?([1-8]?\d(\.\d+)?|90(\.0+)?):-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
    { message: 'coordinate must be a valid string in the format "lat:lng"' },
  )
  coordinate?: string;
}
