import { PartialType } from '@nestjs/mapped-types';
import { CreateDiaryDto } from './create-diary.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDiaryDto extends PartialType(CreateDiaryDto) {
  @ApiProperty({ description: 'ID of the diary entry to update', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  diary_id: number;
}
