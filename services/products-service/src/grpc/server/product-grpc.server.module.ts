import { Module } from "@nestjs/common";
import { CategoriesModule } from "src/categories/categories.module";
import { FarmsModule } from "src/farms/farms.module";
import { ProductsModule } from "src/products/products.module";
import { ProductGrpcServerController } from "./product-grpc.server.controller";
import { AdminModule } from "src/admin/admin.module";
import { ReviewsModule } from "src/reviews/reviews.module";
import { ProcessModule } from "src/process/process.module";

@Module({
    imports: [
        ProductsModule,
        FarmsModule,
        CategoriesModule,
        AdminModule,
        ReviewsModule,
        ProcessModule
    ],
    controllers: [ProductGrpcServerController],
})
export class ProductGrpcServerModule { }