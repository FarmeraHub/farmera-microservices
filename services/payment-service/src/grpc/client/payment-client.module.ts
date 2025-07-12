import { ClientsModule, Transport } from "@nestjs/microservices";
import { Module } from "@nestjs/common";
import { join } from "path";
import { ProductsGrpcClientService } from "./product.service";
import { PaymentGrpcClientController } from "./payment-grpc.client.controller";
import { TestController } from "./test.controller";
import { UserGrpcClientService } from "./user.service";
import { ConfigService } from "@nestjs/config";

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'PRODUCTS_PACKAGE',
                useFactory: async (configService: ConfigService) => ({
                transport: Transport.GRPC,
                options: {
                    package: 'farmera.products',
                    protoPath: join(__dirname, '../../../../../shared/grpc-protos/products/products.proto'),
                    url: configService.get<string>('PRODUCT_GRPC_URL', 'localhost:50052'),
                    loader: {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true,
                        includeDirs: [join(__dirname, '../../../../../shared/grpc-protos')],
                    },
                    },
                }),
                inject: [ConfigService],
            },
            {
                name: 'USERS_PACKAGE',
                useFactory: async (configService: ConfigService) => ({
                transport: Transport.GRPC,
                options: {
                    package: 'farmera.users',
                    protoPath: join(__dirname, '../../../../../shared/grpc-protos/users/users.proto'),
                    url: configService.get<string>('USERS_GRPC_URL', 'localhost:50051'),
                    loader: {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true,
                        includeDirs: [join(__dirname, '../../../../../shared/grpc-protos')],
                    },
                    },
                }),
                inject: [ConfigService],

            }
        ]),
    ],
    controllers: [PaymentGrpcClientController,TestController],
    providers: [ProductsGrpcClientService, UserGrpcClientService],
    exports: [ProductsGrpcClientService, UserGrpcClientService],

})
export class PaymentClientModule { }