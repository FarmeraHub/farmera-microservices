import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsPositive,
    IsBoolean,
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