import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID to add to cart',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({
    description: 'Quantity to add',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Product ID to update',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({
    description: 'New quantity',
    example: 3,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity: number;
}

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'Product ID to remove',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;
}

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Order ID to process payment for',
    example: 'order_123',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Payment method',
    example: 'VNPAY',
  })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'Return URL for payment gateway',
    example: 'https://app.farmera.com/payment/return',
    required: false,
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
