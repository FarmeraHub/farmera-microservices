import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
    PaymentServiceClient,
    HandlePaymentCallbackRequest,
    HandlePaymentCallbackResponse,
} from "@farmera/grpc-proto/dist/payment/payment";
import { ClientGrpc } from "@nestjs/microservices";
import { OrderMapper } from "src/mappers/payment/order.mapper";
import { PayosWebhookDto } from "./payos/dto/payos-webhook.dto";
import { ErrorMapper } from "src/mappers/common/error.mapper";
import { firstValueFrom } from "rxjs";
import { DataPaymentCallbackMapper } from "src/mappers/payment/data_payment_callback.mapper";
@Injectable()
export class PaymentClientService implements OnModuleInit {
    private readonly logger = new Logger(PaymentClientService.name);
    private paymentServiceGrpcClient: PaymentServiceClient;
    constructor(
        @Inject('PAYMENT_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
    ) { }
    onModuleInit() {
        this.paymentServiceGrpcClient = this.clientGrpcInstance.getService<PaymentServiceClient>('PaymentService');
    }

    async handlePaymentCallback(data: PayosWebhookDto): Promise<boolean> {
        try {

            const grpcData = DataPaymentCallbackMapper.toGrpcDataPaymentCallback(data.data);
            const result = await firstValueFrom(this.paymentServiceGrpcClient.handlePaymentCallback({
                code: data.code,
                desc: data.desc,
                data: grpcData,
                success: data.success,
                signature: data.signature,
            }));
            if (result.success === undefined) {
                throw new Error('Success field is missing in the response');
            }
            return result.success;

        } catch (error) {
            throw ErrorMapper.fromGrpcError(error);
        }
    }


}
