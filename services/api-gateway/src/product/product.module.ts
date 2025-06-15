import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { ProductClientService } from "./product.client.service";
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';

@Module({
    imports: [
        ConfigModule,
        ClientsModule.registerAsync([
            {
                name: 'PRODUCTS_PACKAGE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: "farmera.products",
                        protoPath: join(__dirname, '../../../../shared/grpc-protos/products/products.proto',
                        ),
                        url: configService.get<string>('PRODUCT_GRPC_URL', 'localhost:50052'),
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                            includeDirs: [join(__dirname, '../../../../shared/grpc-protos')],
                        },
                    }
                }),
                inject: [ConfigService],
            },
        ]),

    ],
    controllers: [ProductController, FarmController, CategoryController],
    providers: [ProductService, ProductClientService, FarmService, CategoryService],
    exports: [ProductService],
})
export class ProductModule { }