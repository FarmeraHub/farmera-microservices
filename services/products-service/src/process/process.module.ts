import { Module } from '@nestjs/common';
import { ProcessController } from './process.controller';
import { ProcessService } from './process.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Process } from './entities/process.entity';
import { PinataStorageService } from 'src/services/pinata-storage.service';
import { BlockchainService } from 'src/services/blockchain.service';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Process]),
    ProductsModule
  ],
  controllers: [ProcessController],
  providers: [ProcessService, PinataStorageService, BlockchainService],
  exports: [ProcessService]
})
export class ProcessModule { }
