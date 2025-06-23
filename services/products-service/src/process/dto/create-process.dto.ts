import { Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { ProcessStage } from "src/common/enums/process-stage.enum";

export class CreateProcessDto {
    @IsNumber()
    @IsPositive()
    product_id: number;

    @IsEnum(ProcessStage)
    stage_name: ProcessStage;

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