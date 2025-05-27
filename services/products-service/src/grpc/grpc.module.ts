import { Module } from "@nestjs/common";
import { ProductsGrpcController } from "./products-grpc.controller";
import { FarmsModule } from "src/farms/farms.module";
import { ProductsModule } from "src/products/products.module";

@Module({
    imports: [
        FarmsModule,
        ProductsModule,
    ],
    controllers: [ProductsGrpcController],
    providers: [],
    exports: [],
})
export class GrpcModule {

}