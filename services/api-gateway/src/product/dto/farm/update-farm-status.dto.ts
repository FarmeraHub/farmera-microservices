import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FarmStatus } from './farm-filters.dto';

export class UpdateFarmStatusDto {
  @ApiProperty({
    description: 'New farm status',
    enum: FarmStatus,
    example: FarmStatus.APPROVED,
  })
  @IsEnum(FarmStatus)
  @IsNotEmpty()
  status: FarmStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change',
    example: 'All documents verified successfully',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
