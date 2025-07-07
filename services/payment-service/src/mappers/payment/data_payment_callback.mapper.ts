import { DataPaymentCallback } from "@farmera/grpc-proto/dist/payment/payment";
import { PayosWebhookDto, PayOsDataWebhookDto } from "src/payos/dto/payos-webhook.dto";

export class DataPaymentCallbackMapper {
    static fromGrpcDataPaymentCallback(data: DataPaymentCallback): PayOsDataWebhookDto {
        return {
            orderCode: data.order_code,
            amount: data.amount,
            description: data.description,
            accountNumber: data.account_number,
            reference: data.reference,
            transactionDateTime: data.transaction_date_time,
            currency: data.currency,
            paymentLinkId: data.payment_link_id,
            code: data.code,
            desc: data.desc,
            counterAccountBankId: data.counter_account_bank_id,
            counterAccountBankName: data.counter_account_bank_name,
            counterAccountName: data.counter_account_name,
            counterAccountNumber: data.counter_account_number,
            virtualAccountName: data.virtual_account_name,
            virtualAccountNumber: data.virtual_account_number
        };
    }
}