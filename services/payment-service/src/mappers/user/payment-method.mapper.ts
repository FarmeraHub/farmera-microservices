import { PaymentMethod as GrpcPaymentMethod } from "@farmera/grpc-proto/dist/users/users";
import { PaymentMethod } from "src/user/entities/payment_method.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
export class PaymentMethodMapper {
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