import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { PaginationMeta } from './pagination-meta.dto';

export class PaginationResult<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  readonly data: T[];

  @ApiProperty({ type: () => PaginationMeta })
  readonly meta: PaginationMeta;

  constructor(data: T[], meta: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }
}
