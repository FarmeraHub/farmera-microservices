import { Type } from "class-transformer";
import { IsBoolean, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { PaginationOptions } from "src/pagination/dto/pagination-options.dto";


export class SearchFarmDto extends PaginationOptions {
    @IsOptional()
    @IsString({ message: "Từ khóa không hợp lệ" })
    query?: string;

    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    approve_only?: boolean;

    @IsOptional()
    @IsLatitude()
    @Type(() => Number)
    latitude?: number;

    @IsOptional()
    @IsLongitude()
    @Type(() => Number)
    longitude?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    radius_km?: number;
}