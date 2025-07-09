import { IsEnum, IsOptional, IsString, ValidateIf, IsNotEmpty } from 'class-validator';
import { FarmStatus } from 'src/common/enums/product/farm-status.enum';

export class UpdateFarmStatusDto {
    @IsEnum(FarmStatus)
    @IsNotEmpty()
    status: FarmStatus;

    @IsOptional()
    @IsString()
    reason?: string;
}
