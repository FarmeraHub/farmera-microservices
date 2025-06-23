import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { AzureBlobService } from "src/services/azure-blob.service";
import { FarmsModule } from "src/farms/farms.module";
import { CategoriesModule } from "src/categories/categories.module";
import { ProcessModule } from "src/process/process.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    FarmsModule,
    CategoriesModule,
    forwardRef(() => ProcessModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, AzureBlobService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule { }