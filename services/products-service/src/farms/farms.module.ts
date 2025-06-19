import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { Farm } from './entities/farm.entity';
import { Address } from './entities/address.entity';
import { BiometricsModule } from 'src/biometrics/biometrics.module';
import { Identification } from './entities/identification.entity';
import { GhnModule } from 'src/ghn/ghn.module';
import { AddressGHN } from './entities/address-ghn.entity';
import { AzureBlobService } from 'src/services/azure-blob.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm, Address, Identification, AddressGHN]),
    BiometricsModule,
    GhnModule,
  ],
  controllers: [FarmsController],
  providers: [FarmsService, AzureBlobService],
  exports: [
    FarmsService,
    TypeOrmModule,
  ],
})
export class FarmsModule { }