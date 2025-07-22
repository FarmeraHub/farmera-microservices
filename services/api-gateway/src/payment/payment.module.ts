import { ClientsModule, Transport } from "@nestjs/microservices";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";
import { PaymentController } from "./payment.controller";
import { PaymentClientService } from "./payment.client.service";
import { DeliveryController } from './delivery/delivery.controller';
import { DeliveryService } from './delivery/delivery.service';
import { OrderController } from "./order/order.controller";
import { OrderService } from "./order/order.service";
import { PayosController } from "./payos/payos.controller";
import { SubOrderController } from "./sub_order/sub_order.controller";
import { SubOrderService } from "./sub_order/sub_order.service";
import { ProductModule } from "src/product/product.module";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [
        ConfigModule,
        HttpModule,
        ClientsModule.registerAsync([
            {
                name: 'PAYMENT_PACKAGE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: 'farmera.payment',
                        protoPath: join(__dirname, '../../../../shared/grpc-protos/payment/payment.proto'),
                        url: configService.get<string>('PAYMENT_GRPC_URL', 'localhost:50053'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                            includeDirs: [join(__dirname, '../../../../shared/grpc-protos')],
                        },
                    },
                }),
                inject: [ConfigService],
            }
        ]),
        ProductModule,
    ],
    controllers: [PaymentController, DeliveryController, OrderController, PayosController, SubOrderController],
    providers: [PaymentClientService, DeliveryService, OrderService, SubOrderService],
    exports: [],
})
export class PaymentModule { }