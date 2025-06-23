import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { PaginationOptions } from "src/pagination/dto/pagination-options.dto";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductByFarmDto extends PaginationOptions {
    @ApiPropertyOptional({ description: 'Whether to include categories in the result', example: true })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;
}