import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptions } from './pagination-options.dto';

export interface PaginationMetaParameters {
  paginationOptions: PaginationOptions;
  totalItems: number;
}

export class PaginationMeta {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly limit: number;

  @ApiProperty()
  readonly totalItems: number;

  @ApiProperty()
  readonly totalPages: number;

  @ApiProperty()
  readonly hasPreviousPage: boolean;

  @ApiProperty()
  readonly hasNextPage: boolean;

  constructor({ paginationOptions, totalItems }: PaginationMetaParameters) {
    this.page = Number(paginationOptions.page);
    this.limit = Number(paginationOptions.limit);
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(this.totalItems / this.limit);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.totalPages;
  }
}
