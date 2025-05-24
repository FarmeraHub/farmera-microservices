import { Type } from "class-transformer";
import { IsDate, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsObject, IsPositive, IsString, IsUUID } from "class-validator";

export class CreateProcessDto {
    @IsUUID()
    productId: string;

    @IsString()
    @IsNotEmpty()
    stageName: string;

    @Type(() => Object)
    @IsObject()
    description: Record<string, string>

    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @IsLatitude()
    @Type(() => Number)
    latitude: number;

    @IsLongitude()
    @Type(() => Number)
    longitude: number;
}