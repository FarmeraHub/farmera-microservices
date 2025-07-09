import {Payment as GrpcPayment} from "@farmera/grpc-proto/dist/payment/payment";
import { Payment } from "src/payment/payment/entities/payment.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
import { OrderMapper } from "./order.mapper";
export class PaymentMapper {
    static fromGrpcPayment(value: GrpcPayment): Payment | undefined {
        if (!value) return undefined;

       const payment: Payment = {
            payment_id: value.payment_id,
            amount: value.amount,
            currency: value.currency,
            method: EnumMapper.fromGrpcPaymentMethod(value.method),
            status: EnumMapper.fromGrpcPaymentStatus(value.status),
            created: value.created_at ? TypesMapper.fromGrpcTimestamp(value.created_at) : undefined,
            updated: value.updated_at ? TypesMapper.fromGrpcTimestamp(value.updated_at) : undefined,
            paid_at: value.paid_at ? TypesMapper.fromGrpcTimestamp(value.paid_at) : undefined,
        }
        if (value.order) {
            payment.order = OrderMapper.fromGrpcOrder(value.order);
        }
        if (value.transaction_id) {
            payment.transaction_id = value.transaction_id;
        }
        if (value.qr_code) {
            payment.qr_code = value.qr_code;
        }
        if (value.checkout_url) {
            payment.checkout_url = value.checkout_url;
        }
        return payment;
    }
}