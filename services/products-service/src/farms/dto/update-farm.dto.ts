import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

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
    certificate_image_urls: string[];

    @IsString()
    avatar_url: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    profile_image_urls: string[];
}
