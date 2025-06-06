import { Module } from "@nestjs/common";
import { Transport } from "@nestjs/microservices";
import { CategoriesModule } from "src/categories/categories.module";
import { Farm } from "src/farms/entities/farm.entity";
import { FarmsModule } from "src/farms/farms.module";
import { ProductsModule } from "src/products/products.module";
import { ProductGrpcServerController } from "./product-grpc.server.controller";
import { ProductMapper } from "./mappers/product.mapper";

@Module({
    imports: [
        ProductsModule,
        FarmsModule,
        CategoriesModule,

    ],
    controllers: [ProductGrpcServerController],
    providers: [ProductMapper],
    exports: [],

})
export class ProductGrpcServerModule { }