import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class CreateProcessStepDto {
  @IsNumber()
  @IsPositive()
  step_order: number;

  @IsString()
  @IsNotEmpty()
  step_name: string;

  @IsString()
  @IsNotEmpty()
  step_description: string;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean = true;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_duration_days?: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateProcessTemplateDto {
  @IsString()
  @IsNotEmpty()
  process_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_duration_days?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @IsArray()
  @ArrayMinSize(1, { message: 'Process template must have at least one step' })
  @ValidateNested({ each: true })
  @Type(() => CreateProcessStepDto)
  steps: CreateProcessStepDto[];
}
