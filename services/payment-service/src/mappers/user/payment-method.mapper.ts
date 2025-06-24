import { PaymentMethod as GrpcPaymentMethod } from "@farmera/grpc-proto/dist/users/users";
import { PaymentMethod } from "src/user/entities/payment_method.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
export class PaymentMethodMapper {
    static fromGrpcPaymentMethod(value: GrpcPaymentMethod): PaymentMethod | undefined {
        if (!value) return undefined;
        return {
            id: Number(value.id),
            user_id: value.user_id,
            provider: EnumMapper.fromGrpcPaymentProvider(value.type),
            external_id: '',
            last_four: value.last_four_digits,
            card_type: '',
            expiry_date: '',
            cardholder_name: '',
            billing_address: '',
            token: '',
            is_default: value.is_default,
            metadata: '',
            is_active: true,
            created_at: TypesMapper.fromGrpcTimestamp(value.created_at!) || new Date(),
            updated_at: TypesMapper.fromGrpcTimestamp(value.updated_at!) || new Date(),

        };
    }
}