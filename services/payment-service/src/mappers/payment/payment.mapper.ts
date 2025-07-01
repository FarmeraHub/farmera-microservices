import { Payment } from "src/payments/entities/payment.entity";
import { Payment as GrpcPayment } from "@farmera/grpc-proto/dist/payment/payment";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";
import { OrderMapper } from "./order.mapper";

export class PaymentMapper {
    static toGrpcPayment(value: Payment): GrpcPayment{
        return {
            payment_id: value.payment_id,
            order: value.order ? OrderMapper.toGrpcOrder(value.order) : undefined,
            amount: value.amount,
            currency: value.currency,
            method: EnumMapper.toGrpcPaymentMethod(value.method),
            status: EnumMapper.toGrpcPaymentStatus(value.status),
            created_at: TypesMapper.toGrpcTimestamp(value.created), 
            paid_at: TypesMapper.toGrpcTimestamp(value.paid_at),
        };
    }
}