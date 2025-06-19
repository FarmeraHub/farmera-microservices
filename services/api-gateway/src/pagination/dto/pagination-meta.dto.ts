import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptions } from './pagination-options.dto';

export interface PaginationMetaParameters {
  paginationOptions: PaginationOptions;
  totalItems: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
