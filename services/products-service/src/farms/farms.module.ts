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
import { GhnModule } from 'src/ghn/ghn.module';
import { AddressGHN } from './entities/address-ghn.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm, Address, Identification, AddressGHN]),
    MulterModule.registerAsync(multerAsyncConfig),
    BiometricsModule,
    GhnModule,
  ],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [
    FarmsService,
    TypeOrmModule,
  ],
})
export class FarmsModule { }