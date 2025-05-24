import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { Farm } from './entities/farm.entity';
import { Address } from './entities/address.entity';
import { multerAsyncConfig } from '../config/multer.config';
import { BiometricsModule } from 'src/biometrics/biometrics.module';
import { Identification } from './entities/identification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm, Address, Identification]),
    MulterModule.registerAsync(multerAsyncConfig),
    BiometricsModule,
  ],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [
    FarmsService,
    TypeOrmModule,
  ],
})
export class FarmsModule { }