import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { UpdateProcessStepDto } from './update-process-step.dto';

export class UpdateProcessDto {
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
