import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewReply } from './entities/review-reply.entity';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerAsyncConfig } from 'src/config/multer.config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewReply]),
    FileStorageModule,
    MulterModule.registerAsync(multerAsyncConfig),
    HttpModule
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule { }
