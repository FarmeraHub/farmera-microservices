import { forwardRef, Module } from '@nestjs/common';
import { ProcessController } from './process.controller';
import { ProcessService } from './process.service';
import { ProcessTemplateController } from './process-template.controller';
import { ProcessTemplateService } from './process-template.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Process } from './entities/process.entity';
import { ProcessTemplate } from './entities/process-template.entity';
import { ProcessStep } from './entities/process-step.entity';
import { ProductProcessAssignment } from './entities/product-process-assignment.entity';
import { StepDiaryEntry } from '../diary/entities/step-diary-entry.entity';
import { StepDiaryController } from '../diary/step-diary.controller';
import { StepDiaryService } from '../diary/step-diary.service';
import { PinataStorageService } from 'src/services/pinata-storage.service';
import { BlockchainService } from 'src/services/blockchain.service';
import { ProductsModule } from 'src/products/products.module';
import { FarmsModule } from 'src/farms/farms.module';
import { Product } from 'src/products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Process,
      ProcessTemplate,
      ProcessStep,
      ProductProcessAssignment,
      StepDiaryEntry,
      Product,
    ]),
    forwardRef(() => ProductsModule),
    forwardRef(() => FarmsModule),
  ],
  controllers: [
    ProcessController,
    ProcessTemplateController,
    StepDiaryController,
  ],
  providers: [
    ProcessService,
    ProcessTemplateService,
    StepDiaryService,
    PinataStorageService,
    BlockchainService,
  ],
  exports: [
    ProcessService,
    ProcessTemplateService,
    StepDiaryService,
    TypeOrmModule,
  ],
})
export class ProcessModule {}
