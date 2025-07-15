import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DiaryCompletionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export class CreateStepDiaryDto {
  @ApiProperty({
    description: 'Assignment ID linking the product to the process',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  assignment_id: number;

  @ApiProperty({
    description: 'Step ID from the process template',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  step_id: number;

  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  product_id: number;

  @ApiProperty({
    description: 'Name of the step',
    example: 'Chuẩn bị đất',
  })
  @IsNotEmpty()
  @IsString()
  step_name: string;

  @ApiProperty({
    description: 'Order of the step in the process',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  step_order: number;

  @ApiProperty({
    description: 'Notes or description of the work done',
    example: 'Đã làm đất và bón phân hữu cơ',
  })
  @IsNotEmpty()
  @IsString()
  notes: string;

  @ApiProperty({
    description: 'Completion status of the step',
    enum: DiaryCompletionStatus,
    example: DiaryCompletionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(DiaryCompletionStatus)
  completion_status?: DiaryCompletionStatus;

  @ApiProperty({
    description: 'Array of image URLs',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @ApiProperty({
    description: 'Array of video URLs',
    example: ['https://example.com/video1.mp4'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  video_urls?: string[];

  @ApiProperty({
    description: 'Date when the work was recorded',
    example: '2024-01-15T10:30:00Z',
  })
  @IsNotEmpty()
  @IsString()
  recorded_date: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 10.7769,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 106.7009,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Weather conditions during work',
    example: 'Nắng nhẹ',
    required: false,
  })
  @IsOptional()
  @IsString()
  weather_conditions?: string;

  @ApiProperty({
    description: 'Quality rating from 1 to 5',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  quality_rating?: number;

  @ApiProperty({
    description: 'Issues encountered during work',
    example: 'Không có vấn đề',
    required: false,
  })
  @IsOptional()
  @IsString()
  issues_encountered?: string;

  @ApiProperty({
    description: 'Additional data as JSON',
    example: { temperature: 25, humidity: 60 },
    required: false,
  })
  @IsOptional()
  additional_data?: Record<string, any>;
}
