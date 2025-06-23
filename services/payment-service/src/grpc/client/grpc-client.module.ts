import { ClientsModule, Transport } from "@nestjs/microservices";
import { Module } from "@nestjs/common";
import { join } from "path";
import { PaymentGrpcClientService } from "./payment-grpc.client.service";
import { PaymentGrpcClientController } from "./payment-grpc.client.controller";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'PRODUCTS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'farmera.products',
                    protoPath: join(__dirname, '../../../../../shared/grpc-protos/products/products.proto'),
                    url: 'localhost:50052',
                    loader: {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true,
                        includeDirs: [join(__dirname, '../../../../../shared/grpc-protos')],
                    },
                },
            },
            {
                name: 'USERS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'farmera.users',
                    protoPath: join(__dirname, '../../../../../shared/grpc-protos/users/users.proto'),
                    url: 'localhost:50051',
                    loader: {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true,
                        includeDirs: [join(__dirname, '../../../../../shared/grpc-protos')],
                    },
                },
            
            }
        ]),
    ],
    controllers: [PaymentGrpcClientController],
    providers: [PaymentGrpcClientService],
    exports: [],

})
export class PaymentGrpcClientModule { }