import { Type } from "class-transformer";
import { IsArray, IsDate, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";

export class CreateProcessDto {
    @IsNumber()
    @IsPositive()
    product_id: number;

    @IsString()
    @IsNotEmpty()
    stage_name: string;

    @Type(() => Object)
    @IsObject()
    description: Record<string, string>

    @Type(() => Date)
    @IsDate()
    start_date: Date;

    @Type(() => Date)
    @IsDate()
    end_date: Date;

    @IsLatitude()
    @Type(() => Number)
    latitude: number;

    @IsLongitude()
    @Type(() => Number)
    longitude: number;

    @IsArray()
    @IsString({ each: true })
    image_urls: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    video_urls?: string[];
}