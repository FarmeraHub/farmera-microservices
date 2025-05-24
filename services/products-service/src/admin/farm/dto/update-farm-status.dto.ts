import { IsEnum, IsOptional, IsString, ValidateIf, IsNotEmpty } from 'class-validator';
import { FarmStatus } from '../../../common/enums/farm-status.enum';

export class UpdateFarmStatusDto {
    @IsEnum(FarmStatus)
    @IsNotEmpty()
    status: FarmStatus;

    @IsOptional()
    @IsString()
    reason?: string;
}
