import { Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProcessStage } from "src/common/enums/product/process-stage.enum";

export class CreateProcessDto {
    @ApiProperty({ description: 'ID of the product', example: 1 })
    @IsNumber()
    @IsPositive()
    product_id: number;

    @ApiProperty({ description: 'Stage of the process', example: ProcessStage.PRODUCTION })
    @IsEnum(ProcessStage)
    stage_name: ProcessStage;

    @ApiProperty({ description: 'Description object for the process', example: { en: 'Harvesting stage', vi: 'Giai đoạn thu hoạch' } })
    @Type(() => Object)
    @IsObject()
    description: Record<string, string>

    @ApiProperty({ description: 'Start date of the process', example: '2024-01-01T00:00:00.000Z' })
    @Type(() => Date)
    @IsDate()
    start_date: Date;

    @ApiProperty({ description: 'End date of the process', example: '2024-01-10T00:00:00.000Z' })
    @Type(() => Date)
    @IsDate()
    end_date: Date;

    @ApiProperty({ description: 'Latitude of the process location', example: 21.0285 })
    @IsLatitude()
    @Type(() => Number)
    latitude: number;

    @ApiProperty({ description: 'Longitude of the process location', example: 105.8542 })
    @IsLongitude()
    @Type(() => Number)
    longitude: number;

    @ApiProperty({ description: 'Image URLs for the process', example: ['https://example.com/img1.jpg'] })
    @IsArray()
    @IsString({ each: true })
    image_urls: string[];

    @ApiPropertyOptional({ description: 'Video URLs for the process', example: ['https://example.com/video1.mp4'] })
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    video_urls?: string[];
}