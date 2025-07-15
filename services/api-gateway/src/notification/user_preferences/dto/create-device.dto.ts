import { IsNotEmpty, IsString } from "class-validator";

export class CreateDeviceTokenDto {
    @IsString()
    @IsNotEmpty()
    device_token: string;
}