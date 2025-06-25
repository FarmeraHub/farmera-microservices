import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';

// Import the enum from a common location instead of duplicating
// For now, keep in sync with users-service enum
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  OTHER = 'other',
}

// TODO: Consider moving this to a shared package in the future

export class CreatePaymentMethodDto {
  @ApiProperty({
    example: PaymentProvider.STRIPE,
    description: 'Payment provider',
    enum: PaymentProvider,
  })
  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;

  @ApiProperty({
    example: 'pm_1234567890',
    description: 'External payment method ID from provider',
  })
  @IsString()
  @IsNotEmpty()
  external_id: string;

  @ApiProperty({
    example: '4242',
    description: 'Last four digits of card',
    required: false,
    maxLength: 4,
  })
  @IsString()
  @IsOptional()
  @MaxLength(4)
  last_four?: string;

  @ApiProperty({
    example: 'credit',
    description: 'Card type (credit, debit, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  card_type?: string;

  @ApiProperty({
    example: '12/25',
    description: 'Expiry date in MM/YY format',
    required: false,
    pattern: '^(0[1-9]|1[0-2])/\\d{2}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Expiry date should be in MM/YY format',
  })
  expiry_date?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Cardholder name',
    required: false,
  })
  @IsString()
  @IsOptional()
  cardholder_name?: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Billing address',
    required: false,
  })
  @IsString()
  @IsOptional()
  billing_address?: string;

  @ApiProperty({
    example: 'tok_1234567890',
    description: 'Payment method token',
    required: false,
  })
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the default payment method',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @ApiProperty({
    example: '{"stripe_customer_id": "cus_123"}',
    description: 'Additional metadata as JSON string',
    required: false,
  })
  @IsString()
  @IsOptional()
  metadata?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this payment method is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
