import { IsString, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';



export class PayOsDataWebhookDto {
    @IsNumber()
    orderCode: number;

    @IsNumber()
    amount: number;

    @IsString()
    description: string;

    @IsString()
    accountNumber: string;

    @IsString()
    reference: string;

    @IsString()
    transactionDateTime: string;

    @IsString()
    currency: string;

    @IsString()
    paymentLinkId: string;

    @IsString()
    code: string;

    @IsString()
    desc: string;

    @IsOptional()
    @IsString()
    counterAccountBankId?: string;

    @IsOptional()
    @IsString()
    counterAccountBankName?: string;

    @IsOptional()
    @IsString()
    counterAccountName?: string;

    @IsOptional()
    @IsString()
    counterAccountNumber?: string;

    @IsOptional()
    @IsString()
    virtualAccountName?: string;

    @IsOptional()
    @IsString()
    virtualAccountNumber?: string;
}
export class PayosWebhookDto {
    @IsString()
    code: string;

    @IsString()
    desc: string;

    @IsBoolean()
    success: boolean;

    @ValidateNested()
    @Type(() => PayOsDataWebhookDto)
    data: PayOsDataWebhookDto;

    @IsString()
    signature: string;
}