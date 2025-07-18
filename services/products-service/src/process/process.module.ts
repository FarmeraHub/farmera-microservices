import { forwardRef, Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Process } from './entities/process.entity';
import { ProcessStep } from './entities/process-step.entity';
import { StepDiaryEntry } from './entities/step-diary-entry.entity';
import { StepDiaryService } from './step-diary.service';
import { BlockchainService } from 'src/services/blockchain.service';
import { ProductsModule } from 'src/products/products.module';
import { FarmsModule } from 'src/farms/farms.module';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Process,
      ProcessStep,
      StepDiaryEntry,
      Product,
    ]),
    forwardRef(() => ProductsModule),
    forwardRef(() => FarmsModule),
  ],
  providers: [
    ProcessService,
    StepDiaryService,
    BlockchainService,
  ],
  exports: [
    ProcessService,
    StepDiaryService,
    TypeOrmModule,
  ],
})
export class ProcessModule { }
