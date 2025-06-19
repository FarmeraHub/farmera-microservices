import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';
import { firstValueFrom } from 'rxjs';
import { ReviewMapper } from 'src/mappers/product/review.mapper';
import { CreateReplyDto } from './dto/create-reply.dto';
import { ReviewReply } from './entities/review-reply.entity';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';

@Injectable()
export class ReviewService implements OnModuleInit {

    private readonly logger = new Logger(ReviewService.name);
    private productGrpcService: ProductsServiceClient;

    constructor(
        @Inject("PRODUCTS_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.productGrpcService = this.client.getService<ProductsServiceClient>("ProductsService")
    }

    async createReview(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
        try {
            const result = await firstValueFrom(this.productGrpcService.createReview({
                product_id: createReviewDto.product_id,
                user_id: userId,
                rating: createReviewDto.rating,
                comment: createReviewDto.comment,
                image_urls: { list: createReviewDto.image_urls },
                video_urls: { list: createReviewDto.video_urls },
            }));
            return ReviewMapper.fromGrpcReview(result.review);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async createReply(createReplyDto: CreateReplyDto, userId: string): Promise<ReviewReply> {
        try {
            const result = await firstValueFrom(this.productGrpcService.createReply({
                review_id: createReplyDto.review_id,
                reply: createReplyDto.reply,
                user_id: userId
            }));
            return ReviewMapper.fromGrpcReply(result.reply);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async updateReview(updateReviewDto: UpdateReviewDto, userId: string, reviewId: number): Promise<Review> {
        try {
            const result = await firstValueFrom(this.productGrpcService.updateReview({
                review_id: reviewId,
                user_id: userId,
                rating: updateReviewDto.rating,
                comment: updateReviewDto.comment,
                image_urls: updateReviewDto.image_urls ? { list: updateReviewDto.image_urls } : undefined,
                video_urls: updateReviewDto.video_urls ? { list: updateReviewDto.video_urls } : undefined,
            }));
            return ReviewMapper.fromGrpcReview(result.review);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async updateReply(replyId: number, reply: string, userId: string): Promise<ReviewReply> {
        try {
            const result = await firstValueFrom(this.productGrpcService.updateReply({
                reply_id: replyId,
                user_id: userId,
                reply: reply
            }));
            return ReviewMapper.fromGrpcReply(result.reply);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async deleteReview(reviewId: number, userId: string) {
        try {
            const result = await firstValueFrom(this.productGrpcService.deleteReview({
                review_id: reviewId,
                user_id: userId,
            }));
            return result.success;
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async deleteReply(replyId: number, userId: string) {
        try {
            const result = await firstValueFrom(this.productGrpcService.deleteReply({
                reply_id: replyId,
                user_id: userId,
            }));
            return result.success
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async approveReview(reviewId: number, approve: boolean) {
        try {
            const result = await firstValueFrom(this.productGrpcService.approveReview({
                review_id: reviewId,
                approved: approve,
            }));
            return result.success
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}
