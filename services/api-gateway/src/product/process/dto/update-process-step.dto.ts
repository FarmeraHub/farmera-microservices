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