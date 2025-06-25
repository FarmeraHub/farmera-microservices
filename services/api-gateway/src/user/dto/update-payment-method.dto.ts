import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePaymentMethodDto } from './create-payment-method.dto';

export class UpdatePaymentMethodDto extends PartialType(
  CreatePaymentMethodDto,
) {}

export class UpdatePaymentMethodParamsDto {
  @ApiProperty({
    example: '123',
    description: 'Payment method ID to update',
  })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;
}
