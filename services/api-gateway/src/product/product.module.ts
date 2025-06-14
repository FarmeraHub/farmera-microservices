import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { ProductController } from "./product.controller";
import { ProductClientService } from "./product.client.service";
import { ProductService } from "./product.service";

@Module({
    imports: [
        ConfigModule,
        ClientsModule.register([
            {
                name: 'PRODUCTS_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'farmera.products',
                    protoPath: join(__dirname, '../../../../shared/grpc-protos/products/products.proto'),
                    url: 'localhost:50052',
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
        ]),

    ],
    controllers: [ProductController],
    providers: [ProductService, ProductClientService],
    exports: [ProductService],
})
export class ProductModule { }