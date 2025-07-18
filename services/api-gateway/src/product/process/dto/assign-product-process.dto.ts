import { Type } from 'class-transformer';
import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';
import { AssignmentStatus } from 'src/common/enums/product/process-assignment-status';

export class AssignProductToProcessDto {
  @IsNumber()
  @IsPositive()
  process_id: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  target_completion_date?: Date;
}

export class UpdateProductProcessAssignmentDto {
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  current_step_order?: number;

  @IsOptional()
  @IsNumber()
  completion_percentage?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  target_completion_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  actual_completion_date?: Date;
}
