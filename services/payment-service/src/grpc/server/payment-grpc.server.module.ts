import { Module } from "@nestjs/common";
import { PaymentGrpcController } from "./payment-grpc.controller";

@Module({
    // imports: [
    //     ClientsModule.register([
    //     {
    //         name: 'PAYMENT_PACKAGE',
    //         transport: Transport.GRPC,
    //         options: {
    //         package: 'farmera.payment',
    //         protoPath: join(__dirname, '../../../../shared/grpc-protos/payment/payment.proto'),
    //         url: 'localhost:50052',
    //         loader: {
    //             keepCase: true,
    //             longs: String,
    //             enums: String,
    //             defaults: true,
    //             oneofs: true,
    //             includeDirs: [join(__dirname, '../../../../shared/grpc-protos')],
    //         },
    //         },
    //     },
    //     ]),
    // ],
    controllers: [PaymentGrpcController],
})
export class PaymentGrpcServerModule { }