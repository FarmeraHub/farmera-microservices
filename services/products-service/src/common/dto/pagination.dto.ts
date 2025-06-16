import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SimpleCursorPagination {
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
}
