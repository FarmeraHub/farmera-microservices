import { PartialType } from '@nestjs/mapped-types';
import { CreateStepDiaryDto } from './create-step-diary.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateStepDiaryDto extends PartialType(CreateStepDiaryDto) {
  @IsNotEmpty()
  @IsNumber()
  diary_id: number;
}
