import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
    @ApiProperty({ description: 'Rating from 1 to 5', example: 5 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ description: 'Review comment', example: 'Great product!' })
    @IsString()
    @IsNotEmpty()
    comment: string;

    @ApiPropertyOptional({ description: 'Image URLs for the review', example: ['https://example.com/img1.jpg'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    image_urls?: string[];

    @ApiPropertyOptional({ description: 'Video URLs for the review', example: ['https://example.com/video1.mp4'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    video_urls?: string[];
}