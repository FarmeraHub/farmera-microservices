import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { UserStatus } from "src/common/interfaces/user.interface";

export class UpdateUserStatus {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    user_id: string;

    @IsEnum(UserStatus)
    status: UserStatus;
}