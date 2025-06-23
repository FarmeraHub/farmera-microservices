import { IsNotEmpty, IsString } from "class-validator";

export class CreateDeviceTokenDto {
    @IsString()
    @IsNotEmpty()
    user_id: string;

    @IsString()
    @IsNotEmpty()
    device_token: string;
}