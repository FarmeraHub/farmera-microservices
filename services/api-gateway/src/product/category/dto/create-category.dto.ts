import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Subcategory name',
        example: 'Tomatoes',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Category description',
        example: 'Fresh organic vegetables',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Icon image url',
        example: "https://example.com/images/harvest1.jpg",
    })
    @IsString()
    icon_url?: string;
}