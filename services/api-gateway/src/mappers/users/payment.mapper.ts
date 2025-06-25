import { PaymentMethod as GrpcPaymentMethod } from "@farmera/grpc-proto/dist/users/users";
import { TypesMapper } from "../common/types.mapper";
import { PaymentMethod } from "src/user/user/entities/payment_method.entity";
import { EnumMapper } from "../common/enum.mapper";

export class PaymentMapper {
    static toGrpcPaymentMethod(paymentMethod: PaymentMethod): GrpcPaymentMethod {
        return {
            id: paymentMethod.payment_method_id,
            provider: EnumMapper.toGrpcPaymentProvider(paymentMethod.provider),
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

    static fromGrpcPaymentMethod(grpcPaymentMethod: GrpcPaymentMethod): PaymentMethod {
        return {
            payment_method_id: grpcPaymentMethod.id,
            provider: EnumMapper.fromGrpcPaymentProvider(grpcPaymentMethod.provider),
            external_id: grpcPaymentMethod.external_id,
            last_four: grpcPaymentMethod.last_four,
            card_type: grpcPaymentMethod.card_type,
            expiry_date: grpcPaymentMethod.expiry_date,
            cardholder_name: grpcPaymentMethod.cardholder_name,
            billing_address: grpcPaymentMethod.billing_address,
            token: grpcPaymentMethod.token,
            is_default: grpcPaymentMethod.is_default,
            is_active: grpcPaymentMethod.is_active,
            created_at: TypesMapper.fromGrpcTimestamp(grpcPaymentMethod.created_at),
            updated_at: TypesMapper.fromGrpcTimestamp(grpcPaymentMethod.updated_at),
        }
    }
}