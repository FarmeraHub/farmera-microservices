import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUrl, ValidateNested } from 'class-validator';
import { UpdateAddressDto } from './update-address.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFarmDto {
    @ApiPropertyOptional({ description: 'Farm name', example: 'Green Valley Farm' })
    @IsOptional()
    @IsString()
    farm_name: string;

    @ApiPropertyOptional({ description: 'Description of the farm', example: 'We grow organic vegetables and fruits.' })
    @IsOptional()
    @IsString()
    description: string;

    @ApiPropertyOptional({ description: 'Email address for contact', example: 'info@greenvalley.com' })
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ description: 'Vietnamese phone number', example: '+84901234567' })
    @IsOptional()
    @IsPhoneNumber('VN')
    phone: string;

    @ApiPropertyOptional({ description: 'Tax number (if applicable)', example: '1234567890' })
    @IsOptional()
    @IsString()
    tax_number: string;

    @ApiPropertyOptional({ description: 'City where the farm is located', example: 'Hanoi' })
    @IsOptional()
    @IsString()
    city: string;

    @ApiPropertyOptional({ description: 'District where the farm is located', example: 'Ba Dinh' })
    @IsOptional()
    @IsString()
    district: string;

    @ApiPropertyOptional({ description: 'Ward where the farm is located', example: 'Phuc Xa' })
    @IsOptional()
    @IsString()
    ward: string;

    @ApiPropertyOptional({ description: 'Street address of the farm', example: '123 Nguyen Chi Thanh' })
    @IsOptional()
    @IsNotEmpty()
    street: string;

    @ApiPropertyOptional({ description: 'Coordinates in "lat,lng" format', example: '21.0285,105.8542' })
    @IsOptional()
    @IsNotEmpty()
    coordinate: string;

    @ApiPropertyOptional({ description: 'Profile images', example: ['https://example.com/img1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    // @IsUrl({}, { each: true })
    profile_image: string[];

    @ApiPropertyOptional({ description: 'Certificate images', example: ['https://example.com/cert1.jpg'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    // @IsUrl({}, { each: true })
    certificate_image: string[];

}
