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
import { CreateProcessStepDto } from './create-process-step.dto';

export class CreateProcessDto {
  @IsString()
  @IsNotEmpty()
  process_name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimated_duration_days: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @IsArray()
  @ArrayMinSize(1, { message: 'Process template must have at least one step' })
  @ValidateNested({ each: true })
  @Type(() => CreateProcessStepDto)
  steps: CreateProcessStepDto[];
}
