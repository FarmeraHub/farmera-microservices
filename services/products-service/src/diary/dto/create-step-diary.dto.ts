import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsArray,
  IsDate,
  IsLatitude,
  IsLongitude,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { DiaryCompletionStatus } from '../entities/step-diary-entry.entity';

export class CreateStepDiaryDto {
  @IsNumber()
  @IsPositive()
  assignment_id: number;

  @IsNumber()
  @IsPositive()
  step_id: number;

  @IsNumber()
  @IsPositive()
  product_id: number;

  @IsString()
  @IsNotEmpty()
  step_name: string;

  @IsNumber()
  @IsPositive()
  step_order: number;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsOptional()
  @IsEnum(DiaryCompletionStatus)
  completion_status?: DiaryCompletionStatus = DiaryCompletionStatus.IN_PROGRESS;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  video_urls?: string[] = [];

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  recorded_date?: Date = new Date();

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  weather_conditions?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  quality_rating?: number;

  @IsOptional()
  @IsString()
  issues_encountered?: string;

  @IsOptional()
  additional_data?: Record<string, any>;
}
