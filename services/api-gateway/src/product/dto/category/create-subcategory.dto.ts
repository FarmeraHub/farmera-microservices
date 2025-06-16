import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcategoryDto {
  @ApiProperty({
    description: 'Subcategory name',
    example: 'Tomatoes',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Subcategory description',
    example: 'All types of tomatoes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Parent category ID',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  category_id: number;
}
