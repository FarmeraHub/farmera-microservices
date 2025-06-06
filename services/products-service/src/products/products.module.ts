import { ConfigModule } from '@nestjs/config';
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { MulterModule } from "@nestjs/platform-express";
import { multerAsyncConfig } from "src/config/multer.config";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductSubcategoryDetail } from "./entities/product-subcategory-detail.entity";
import { CategoriesModule } from "src/categories/categories.module";
import { FarmsService } from "src/farms/farms.service";
import { FarmsModule } from "src/farms/farms.module";
import { FileStorageModule } from "src/file-storage/file-storage.module";
@Module({
     imports: [
        TypeOrmModule.forFeature([Product,ProductSubcategoryDetail]),
        CategoriesModule,
        FarmsModule,
        FileStorageModule,
        MulterModule.registerAsync(multerAsyncConfig),
      ],
    controllers: [ProductsController],
    providers: [ProductsService,],
    exports: [ProductsService],
    })
export class ProductsModule {}