import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class AssignProductToProcessDto {
  @IsNumber()
  @IsPositive()
  process_id: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  target_completion_date?: string;
}

export class UpdateProductProcessAssignmentDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  target_completion_date?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  current_step_order?: number;

  @IsOptional()
  @IsNumber()
  completion_percentage?: number;
}
