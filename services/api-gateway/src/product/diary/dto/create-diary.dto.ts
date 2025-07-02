import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateDiaryDto {
  @ApiProperty({ description: 'ID of the process', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  process_id: number;

  @ApiProperty({
    description: 'Name of the step',
    example: 'Chuẩn bị đất trồng',
  })
  @IsNotEmpty()
  @IsString()
  step_name: string;

  @ApiProperty({
    description: 'Description of the step',
    example: 'Đào xới đất cho cây',
  })
  @IsNotEmpty()
  @IsString()
  step_description: string;

  @ApiPropertyOptional({
    description: 'Image URLs for the diary entry',
    example: ['https://example.com/img1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @ApiPropertyOptional({
    description: 'Video URLs for the diary entry',
    example: ['https://example.com/video1.mp4'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  video_urls?: string[];

  @ApiProperty({
    description: 'Date when the step was recorded',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  recorded_date: string;

  @ApiPropertyOptional({
    description: 'Latitude of the location',
    example: 21.0285,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of the location',
    example: 105.8542,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Weather was perfect for planting',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
