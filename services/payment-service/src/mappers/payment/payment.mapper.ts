import { Payment } from "src/payments/entities/payment.entity";
import { Payment as GrpcPayment } from "@farmera/grpc-proto/dist/payment/payment";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";
import { OrderMapper } from "./order.mapper";

export class PaymentMapper {
    static toGrpcPayment(value: Payment): GrpcPayment {
        const grpcPayment: GrpcPayment = {
            payment_id: value.payment_id,
            order: value.order ? OrderMapper.toGrpcOrder(value.order) : undefined,
            amount: value.amount,
            currency: value.currency,
            method: EnumMapper.toGrpcPaymentMethod(value.method),
            status: EnumMapper.toGrpcPaymentStatus(value.status),
            created_at: TypesMapper.toGrpcTimestamp(value.created),
            
        };
        if (value.paid_at) {
            grpcPayment.paid_at = TypesMapper.toGrpcTimestamp(value.paid_at);
        }
        if (value.transaction_id) {
            grpcPayment.transaction_id = value.transaction_id;
        }
        if (value.qr_code) {
            grpcPayment.qr_code = value.qr_code;
        }
        if(value.checkout_url) {
            grpcPayment.checkout_url = value.checkout_url;
        }

        return grpcPayment;
    }
}
