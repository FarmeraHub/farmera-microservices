import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentMethodDto extends PartialType(
    CreatePaymentDto,
) { }

export class UpdatePaymentMethodParamsDto {
    @ApiProperty({
        example: '123',
        description: 'Payment method ID to update',
    })
    @IsNotEmpty()
    @IsString()
    payment_method_id: string;
}