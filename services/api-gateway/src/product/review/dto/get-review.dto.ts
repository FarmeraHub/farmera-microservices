import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetReviewsDto {
    @ApiProperty({ description: 'Product ID', example: 1 })
    @IsNumber()
    @Type(() => Number)
    product_id: number;

    @ApiPropertyOptional({ description: 'Sort by field', enum: ['created', 'rating'], example: 'created' })
    @IsOptional()
    @IsEnum(['created', 'rating'])
    sortBy: 'created' | 'rating' = 'created';

    @ApiPropertyOptional({ description: 'Order direction', enum: ['ASC', 'DESC'], example: 'DESC' })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({ description: 'Limit of reviews to return', example: 10 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit = 10;

    @ApiPropertyOptional({ description: 'Cursor for pagination', example: 'abcdef' })
    @IsOptional()
    @IsString()
    cursor: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page: number;
}
