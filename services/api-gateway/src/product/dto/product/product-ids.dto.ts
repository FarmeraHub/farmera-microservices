import { IsArray, ArrayNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductIdsDto {
  @ApiProperty({
    description: 'Array of product IDs',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  product_ids: number[];
}
