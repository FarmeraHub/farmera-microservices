import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { PaymentProvider } from 'src/enums/payment_method.enum';

export class CreatePaymentMethodDto {
  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  external_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(4)
  last_four?: string;

  @IsString()
  @IsOptional()
  card_type?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Expiry date should be in MM/YY format',
  })
  expiry_date?: string;

  @IsString()
  @IsOptional()
  cardholder_name?: string;

  @IsString()
  @IsOptional()
  billing_address?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @IsString()
  @IsOptional()
  metadata?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdatePaymentMethodDto {
  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @IsString()
  @IsOptional()
  external_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4)
  last_four?: string;

  @IsString()
  @IsOptional()
  card_type?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Expiry date should be in MM/YY format',
  })
  expiry_date?: string;

  @IsString()
  @IsOptional()
  cardholder_name?: string;

  @IsString()
  @IsOptional()
  billing_address?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @IsString()
  @IsOptional()
  metadata?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
