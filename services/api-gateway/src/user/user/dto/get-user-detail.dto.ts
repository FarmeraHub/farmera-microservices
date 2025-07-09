import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { UserRole, UserStatus } from "src/common/interfaces/user.interface";
import { Order, PaginationOptions, SortOption } from "src/pagination/dto/pagination-options.dto";

export class GetUserDetailDto {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_locations: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    include_payment_methods: boolean;
}

export class ListUserDto extends PaginationOptions {
    @IsOptional()
    @IsEnum(UserRole)
    role_filter?: UserRole;

    @IsOptional()
    @IsEnum(UserStatus)
    status_filter?: UserStatus;

    @IsOptional()
    @IsString()
    search_query?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    start_time?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    end_time?: Date;
}