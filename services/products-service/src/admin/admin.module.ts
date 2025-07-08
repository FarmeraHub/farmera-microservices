import { Module } from '@nestjs/common';
import { FarmAdminService } from './farm/farm-admin.service';
import { FarmAdminController } from './farm/farm-admin.controller';
import { FarmsModule } from 'src/farms/farms.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApproveDetail } from './farm/entities/approve-detail.entity';
import { ProductsModule } from 'src/products/products.module';
import { ProductAdminService } from './product/product-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApproveDetail]),
    FarmsModule,
    ProductsModule
  ],
  controllers: [FarmAdminController],
  providers: [FarmAdminService, ProductAdminService],
  exports: [FarmAdminService, ProductAdminService],
})
export class AdminModule { }
