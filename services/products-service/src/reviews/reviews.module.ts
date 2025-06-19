import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewReply } from './entities/review-reply.entity';
import { AzureBlobService } from 'src/services/azure-blob.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewReply]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, AzureBlobService],
  exports: [ReviewsService]
})
export class ReviewsModule { }
