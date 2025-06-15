import { PartialType } from '@nestjs/swagger';
import { RegisterFarmDto } from './register-farm.dto';

export class UpdateFarmDto extends PartialType(RegisterFarmDto) {}
