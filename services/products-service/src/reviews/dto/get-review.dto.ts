import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetReviewsDto {
    @IsNumber()
    @Type(() => Number)
    product_id: number;

    @IsOptional()
    @IsEnum(['created', 'rating'])
    sort_by: 'created' | 'rating' = 'created';

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    order: 'ASC' | 'DESC' = 'DESC';

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit = 10;

    @IsOptional()
    @IsString()
    cursor: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page: number;
}
