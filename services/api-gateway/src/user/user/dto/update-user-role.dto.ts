import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { UserRole } from "src/common/interfaces/user.interface";

export class UpdateUserRoleDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    user_id: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    farm_id?: string;
}