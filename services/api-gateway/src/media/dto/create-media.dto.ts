import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum MediaType {
  USER = 'user',
  PRODUCT = 'product',
  CATEGORY = 'category',
  ORDER = 'order',
  GENERAL = 'general',
}

export class CreateMediaDto {
  @ApiProperty({
    description: 'Type/category of the media file',
    enum: MediaType,
    example: MediaType.PRODUCT,
  })
  @IsEnum(MediaType)
  groupType: MediaType;

  @ApiProperty({
    description: 'Optional name for the media file',
    example: 'product-image-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;
}
