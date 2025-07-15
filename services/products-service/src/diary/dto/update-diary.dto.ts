import { PartialType } from '@nestjs/mapped-types';
import { CreateDiaryDto } from './create-diary.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateDiaryDto extends PartialType(CreateDiaryDto) {
  @IsNotEmpty()
  @IsNumber()
  diary_id: number;
}
