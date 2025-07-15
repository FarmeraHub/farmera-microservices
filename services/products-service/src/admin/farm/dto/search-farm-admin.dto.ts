import { Type } from "class-transformer";
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { FarmStatus } from "src/common/enums/farm-status.enum";


export class AdminSearchFarmDto {
    @IsOptional()
    @IsString({ message: "Từ khóa không hợp lệ" })
    query?: string;

    @IsEnum(FarmStatus)
    status_filter?: FarmStatus;

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