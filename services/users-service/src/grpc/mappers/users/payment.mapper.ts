import { PaymentMethod as GrpcPaymentMethod } from '@farmera/grpc-proto/dist/users/users';
import { PaymentMethod } from 'src/users/entities/payment_method.entity';
import { EnumsMapper } from '../common/enums.mapper';
import { TypesMapper } from '../common/types.mapper';

export class PaymentMapper {
  static toGrpcPaymentMethod(paymentMethod: PaymentMethod): GrpcPaymentMethod {
    return {
      id: paymentMethod.id.toString(),
      user_id: paymentMethod.user_id,
      type: EnumsMapper.toGrpcPaymentMethodType(paymentMethod.provider),
      display_name: paymentMethod.cardholder_name || 'Payment Method',
      last_four_digits: paymentMethod.last_four || '',
      provider: paymentMethod.provider,
      is_default: paymentMethod.is_default,
      expires_at: paymentMethod.expiry_date
        ? this.parseExpiryToTimestamp(paymentMethod.expiry_date)
        : undefined,
      created_at: TypesMapper.toGrpcTimestamp(paymentMethod.created_at),
      updated_at: TypesMapper.toGrpcTimestamp(paymentMethod.updated_at),
      metadata: paymentMethod.metadata
        ? JSON.parse(paymentMethod.metadata)
        : {},
    };
  }

  private static parseExpiryToTimestamp(expiry: string): any {
    try {
      // Assuming expiry is in MM/YY format
      const [month, year] = expiry.split('/');
      const fullYear = parseInt('20' + year);
      const expiryDate = new Date(fullYear, parseInt(month) - 1, 1);
      return TypesMapper.toGrpcTimestamp(expiryDate);
    } catch {
      return null;
    }
  }
}
