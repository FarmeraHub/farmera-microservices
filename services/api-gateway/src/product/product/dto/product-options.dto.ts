import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductOptions {
    @ApiPropertyOptional({ description: 'Whether to include farm information', example: true })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_farm?: boolean;

    @ApiPropertyOptional({ description: 'Whether to include farm address information', example: true })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_farm_address?: boolean;

    @ApiPropertyOptional({ description: 'Whether to include farm stats information', example: true })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_farm_stats?: boolean;

    @ApiPropertyOptional({ description: 'Whether to include processes', example: true })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_processes?: boolean;

    @ApiPropertyOptional({ description: 'Whether to include categories', example: false })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;
}