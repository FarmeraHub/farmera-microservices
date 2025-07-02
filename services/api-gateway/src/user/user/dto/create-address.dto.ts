import { IsBoolean, IsNotEmpty, IsPhoneNumber, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
    @ApiProperty({ example: 'Ho Chi Minh City', description: 'City name' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ example: 'District 1', description: 'District name' })
    @IsString()
    @IsNotEmpty()
    district: string;

    @ApiProperty({ example: 'Ward 1', description: 'Ward name' })
    @IsString()
    @IsNotEmpty()
    ward: string;

    @ApiProperty({ example: 'Nguyen Hue Street', description: 'Street name' })
    @IsString()
    @IsNotEmpty()
    street: string;

    @ApiProperty({ example: '123 Nguyen Hue Street, Building A, Floor 5', description: 'Complete address line' })
    @IsString()
    @IsNotEmpty()
    address_line: string;

    @ApiProperty({ example: 'home', description: 'Address type (home, work, shipping, etc.)' })
    @IsString()
    @IsNotEmpty()
    type: string; // e.g., 'home', 'work', 'shipping', etc.

    @ApiProperty({ example: true, description: 'Whether this is the primary address' })
    @IsBoolean()
    @IsNotEmpty()
    is_primary: boolean;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsPhoneNumber("VN")
    @IsNotEmpty()
    phone: string
}
