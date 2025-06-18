import { Type } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class ProductOptions {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_farm?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_processes?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_categories?: boolean;
}