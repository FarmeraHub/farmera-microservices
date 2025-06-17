import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { join } from "path";
import { FarmController } from './farm/farm.controller';
import { FarmService } from './farm/farm.service';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { ReviewController } from './review/review.controller';
import { ReviewService } from './review/review.service';
import { ProcessController } from './process/process.controller';
import { ProcessService } from './process/process.service';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';

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
    controllers: [ProductController, FarmController, CategoryController, ReviewController, ProcessController, AdminController],
    providers: [ProductService, FarmService, CategoryService, ReviewService, ProcessService, AdminService],
    exports: [ProductService],
})
export class ProductModule { }