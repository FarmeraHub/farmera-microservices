import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  IsEnum,
} from 'class-validator';
import { DiaryStatus } from '../../common/enums/diary-status.enum';

export class CreateDiaryDto {
  @IsNotEmpty()
  @IsNumber()
  process_id: number;

  @IsNotEmpty()
  @IsString()
  step_name: string;

  @IsNotEmpty()
  @IsString()
  step_description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  video_urls?: string[];

  @IsNotEmpty()
  @IsDateString()
  recorded_date: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(DiaryStatus)
  status?: DiaryStatus;
}
