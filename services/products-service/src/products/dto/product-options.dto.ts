import { IsBoolean, IsOptional } from "class-validator";

export class ProductOptions {
    @IsOptional()
    @IsBoolean()
    include_farm?: boolean;

    @IsOptional()
    @IsBoolean()
    include_farm_address?: boolean;

    @IsOptional()
    @IsBoolean()
    include_processes?: boolean;

    @IsOptional()
    @IsBoolean()
    include_categories?: boolean;

    @IsOptional()
    @IsBoolean()
    include_farm_stats?: boolean;
}