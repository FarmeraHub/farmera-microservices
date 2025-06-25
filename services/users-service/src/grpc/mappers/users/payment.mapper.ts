import { PaymentMethod as GrpcPaymentMethod } from "@farmera/grpc-proto/dist/users/users";
import { PaymentMethod } from "src/users/entities/payment_method.entity";
import { EnumsMapper } from "../common/enums.mapper";
import { TypesMapper } from "../common/types.mapper";

export class PaymentMapper {
    static toGrpcPaymentMethod(paymentMethod: PaymentMethod): GrpcPaymentMethod {
        return {
            id: paymentMethod.payment_method_id,
            provider: EnumsMapper.toGrpcPaymentProvider(paymentMethod.provider),
            external_id: paymentMethod.external_id,
            last_four: paymentMethod.last_four,
            card_type: paymentMethod.card_type,
            expiry_date: paymentMethod.expiry_date,
            cardholder_name: paymentMethod.cardholder_name,
            billing_address: paymentMethod.billing_address,
            token: paymentMethod.token,
            is_default: paymentMethod.is_default,
            is_active: paymentMethod.is_active,
            created_at: TypesMapper.toGrpcTimestamp(paymentMethod.created_at),
            updated_at: TypesMapper.toGrpcTimestamp(paymentMethod.updated_at),
        };
    }
}