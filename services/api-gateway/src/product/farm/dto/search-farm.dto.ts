import { Type } from "class-transformer";
import { IsBoolean, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PaginationOptions } from "src/pagination/dto/pagination-options.dto";
import { ApiPropertyOptional } from '@nestjs/swagger';


export class SearchFarmDto extends PaginationOptions {
    @ApiPropertyOptional({ description: 'Search query for farm name or description', example: 'organic' })
    @IsOptional()
    @IsString({ message: "Từ khóa không hợp lệ" })
    query?: string;

    @ApiPropertyOptional({ description: 'Only show approved farms', example: true })
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    approve_only?: boolean;

    @ApiPropertyOptional({ description: 'Latitude for location-based search', example: 21.0285 })
    @IsOptional()
    @IsLatitude()
    @Type(() => Number)
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude for location-based search', example: 105.8542 })
    @IsOptional()
    @IsLongitude()
    @Type(() => Number)
    longitude?: number;

    @ApiPropertyOptional({ description: 'Radius in kilometers for location-based search', example: 10 })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    radius_km?: number;
}