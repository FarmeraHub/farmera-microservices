import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { AzureBlobService } from '../services/azure-blob.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, AzureBlobService],
  exports: [MediaService, AzureBlobService],
})
export class MediaModule {}
