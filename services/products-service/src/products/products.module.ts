import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { Farm } from 'src/farms/entities/farm.entity';
import { StepDiaryEntry } from 'src/process/entities/step-diary-entry.entity';
import { AzureBlobService } from 'src/services/azure-blob.service';
import { BlockchainService } from 'src/services/blockchain.service';
import { FarmsService } from 'src/farms/farms.service';
import { FarmsModule } from 'src/farms/farms.module';
import { BiometricsModule } from 'src/biometrics/biometrics.module';
import { GhnModule } from 'src/ghn/ghn.module';
import { Process } from 'src/process/entities/process.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Subcategory,
      Farm,
      Process,
      StepDiaryEntry,
    ]),
    FarmsModule,
    BiometricsModule,
    GhnModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService, AzureBlobService, BlockchainService, FarmsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule { }
