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

    @IsNumber()
    @IsPositive()
    estimated_duration_days: number;

    @IsString()
    instructions: string;
}