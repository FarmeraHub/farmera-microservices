import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination-query.dto';

export enum FarmStatus {
  UNSPECIFIED = 'UNSPECIFIED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED',
  REJECTED = 'REJECTED',
}

export class FarmFiltersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for farm name, email, or city',
    example: 'Green Valley',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Farm status filter',
    enum: FarmStatus,
    example: FarmStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(FarmStatus)
  status?: FarmStatus;

  @ApiPropertyOptional({
    description: 'City filter',
    example: 'Ho Chi Minh City',
  })
  @IsOptional()
  @IsString()
  city?: string;
}
