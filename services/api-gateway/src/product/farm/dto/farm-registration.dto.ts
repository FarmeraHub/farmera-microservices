import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FarmRegistrationDto {
    @ApiProperty({ description: 'Name of the farm', example: 'Green Valley Farm' })
    @IsString()
    @IsNotEmpty()
    farm_name: string;

    @ApiPropertyOptional({ description: 'Description of the farm', example: 'We grow organic vegetables and fruits.' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Email address for contact', example: 'info@greenvalley.com' })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Vietnamese phone number', example: '+84901234567' })
    @IsNotEmpty()
    @IsPhoneNumber('VN')
    phone: string;

    @ApiPropertyOptional({ description: 'Tax number (if applicable)', example: '1234567890' })
    @IsString()
    @IsOptional()
    tax_number?: string;

    @ApiProperty({ description: 'City where the farm is located', example: 'Hanoi' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ description: 'District where the farm is located', example: 'Ba Dinh' })
    @IsString()
    @IsNotEmpty()
    district: string;

    @ApiProperty({ description: 'Ward where the farm is located', example: 'Phuc Xa' })
    @IsString()
    @IsNotEmpty()
    ward: string;

    @ApiProperty({ description: 'Street address of the farm', example: '123 Nguyen Chi Thanh' })
    @IsString()
    @IsNotEmpty()
    street: string;

    @ApiProperty({ description: 'Coordinates in "lat,lng" format', example: '21.0285,105.8542' })
    @IsString()
    @IsNotEmpty()
    coordinate: string;
}
