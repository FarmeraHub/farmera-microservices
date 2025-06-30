import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from "src/common/enums/user/payment_method.enum";

export class CreatePaymentDto {
    @ApiProperty({ example: 'VNPAY', description: 'Payment provider', enum: PaymentProvider })
    @IsEnum(PaymentProvider)
    @IsNotEmpty()
    provider: PaymentProvider;

    @ApiProperty({ example: 'external-123', description: 'External payment ID' })
    @IsString()
    @IsNotEmpty()
    external_id?: string;

    @ApiProperty({ example: '1234', description: 'Last four digits of card', required: false })
    @IsString()
    @IsOptional()
    last_four?: string;

    @ApiProperty({ example: 'Visa', description: 'Card type', required: false })
    @IsString()
    @IsOptional()
    card_type?: string;

    @ApiProperty({ example: '12/25', description: 'Expiry date in MM/YY format', required: false })
    @IsString()
    @IsOptional()
    @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
        message: 'Expiry date should be in MM/YY format',
    })
    expiry_date?: string;

    @ApiProperty({ example: 'John Doe', description: 'Cardholder name', required: false })
    @IsString()
    @IsOptional()
    cardholder_name?: string;

    @ApiProperty({ example: '123 Main St, City', description: 'Billing address', required: false })
    @IsString()
    @IsOptional()
    billing_address?: string;

    @ApiProperty({ example: 'token-abc-123', description: 'Payment token', required: false })
    @IsString()
    @IsOptional()
    token?: string;

    @ApiProperty({ example: true, description: 'Is this the default payment method?', required: false })
    @IsBoolean()
    @IsOptional()
    is_default?: boolean = true;

    @ApiProperty({ example: true, description: 'Is this the active payment method?', required: false })
    @IsBoolean()
    @IsOptional()
    is_active?: boolean = true;
}
