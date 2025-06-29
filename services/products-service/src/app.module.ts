import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsModule } from './farms/farms.module';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { BiometricsModule } from './biometrics/biometrics.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ProcessModule } from './process/process.module';
import { DiaryModule } from './diary/diary.module';
import { ProductGrpcServerModule } from './grpc/server/product-grpc.server.module';
import { GhnModule } from './ghn/ghn.module';
import { AzureBlobService } from './services/azure-blob.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // MulterModule.registerAsync(multerAsyncConfig),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    BiometricsModule,
    FarmsModule,
    AdminModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    ProcessModule,
    DiaryModule,
    ProductGrpcServerModule,
    GhnModule,
  ],
  providers: [AzureBlobService],
})
export class AppModule {}
