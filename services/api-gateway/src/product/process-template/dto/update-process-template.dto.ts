import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProcessStepDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  step_id?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  step_order?: number;

  @IsOptional()
  @IsString()
  step_name?: string;

  @IsOptional()
  @IsString()
  step_description?: string;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_duration_days?: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class UpdateProcessTemplateDto {
  @IsOptional()
  @IsString()
  process_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_duration_days?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProcessStepDto)
  steps?: UpdateProcessStepDto[];
}
