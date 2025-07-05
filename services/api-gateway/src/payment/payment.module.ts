import { ClientsModule, Transport } from "@nestjs/microservices";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "path";
import { PaymentController } from "./payment.controller";
import { PaymentClientService } from "./payment.client.service";
import { DeliveryController } from './delivery/delivery.controller';
import { DeliveryService } from './delivery/delivery.service';
import { OrderController } from "./order/order.controller";
import { OrderService } from "./order/order.service";

@Module({
    imports: [
        ConfigModule,
        ClientsModule.register([
            {
                name: 'PAYMENT_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'farmera.payment',
                    protoPath: join(__dirname, '../../../../shared/grpc-protos/payment/payment.proto'),
                    url: 'localhost:50053',
                    loader: {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true,
                        includeDirs: [join(__dirname, '../../../../shared/grpc-protos')],
                    },
                },
            }
        ])
    ],
    controllers: [PaymentController, DeliveryController,OrderController],
    providers: [PaymentClientService, DeliveryService,OrderService],
    exports: [],
})
export class PaymentModule { }