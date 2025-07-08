import { DataPaymentCallback } from "@farmera/grpc-proto/dist/payment/payment";
import { PayOsDataWebhookDto } from "src/payment/payos/dto/payos-webhook.dto";

export class DataPaymentCallbackMapper {
    static toGrpcDataPaymentCallback(data: PayOsDataWebhookDto): DataPaymentCallback {
        const grpcData: DataPaymentCallback = {
            order_code: data.orderCode,
            amount: data.amount,
            description: data.description,
            account_number: data.accountNumber,
            reference: data.reference,
            transaction_date_time: data.transactionDateTime,
            currency: data.currency,
            payment_link_id: data.paymentLinkId,
            code: data.code,
            desc: data.desc,
        }
        if (data.counterAccountBankId) {
            grpcData.counter_account_bank_id = data.counterAccountBankId;
        }
        if (data.counterAccountBankName) {
            grpcData.counter_account_bank_name = data.counterAccountBankName;
        }
        if (data.counterAccountName) {
            grpcData.counter_account_name = data.counterAccountName;
        }
        if (data.counterAccountNumber) {
            grpcData.counter_account_number = data.counterAccountNumber;
        }
        if (data.virtualAccountName) {
            grpcData.virtual_account_name = data.virtualAccountName;
        }
        if (data.virtualAccountNumber) {
            grpcData.virtual_account_number = data.virtualAccountNumber;
        }
        return grpcData;
    }
}