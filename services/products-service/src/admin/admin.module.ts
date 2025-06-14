import { Module } from '@nestjs/common';
import { FarmAdminService } from './farm/farm-admin.service';
import { FarmAdminController } from './farm/farm-admin.controller';
import { FarmsModule } from 'src/farms/farms.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApproveDetail } from './farm/entities/approve-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApproveDetail]),
    FarmsModule, 
  ],
  controllers: [FarmAdminController],
  providers: [FarmAdminService],
  exports: [FarmAdminService],
})
export class AdminModule {}
