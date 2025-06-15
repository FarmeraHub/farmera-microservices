import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, ValidateNested } from 'class-validator';
import { UpdateAddressDto } from './update-address.dto';

export class UpdateFarmDto {
    @IsOptional()
    @IsString()
    farm_name: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsPhoneNumber('VN')
    phone: string;

    @IsOptional()
    @IsString()
    tax_number: string;

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
    @IsNotEmpty()
    street: string;

    @IsOptional()
    @IsNotEmpty()
    coordinate: string;

     @IsOptional()
    @IsArray()
    @IsString({ each: true })
    // @IsUrl({}, { each: true })
    profile_image: string[];  

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    // @IsUrl({}, { each: true })
    certificate_image: string[];

}
