// src/shipping/dto/shipping-calculation-item.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min, IsInt } from 'class-validator';
import { BaseOrderDto } from './base-order.dto';

export class CalculateShippingFeeDto extends BaseOrderDto {

}