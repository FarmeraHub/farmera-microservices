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
import { SimpleCursorPagination } from 'src/pagination/dto/pagination-options.dto';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';
import { GetReviewsDto } from './dto/get-review.dto';
import { RatingStatsDto } from './dto/rating-stat.dto';

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
                image_urls: createReviewDto.image_urls ? { list: createReviewDto.image_urls } : undefined,
                video_urls: createReviewDto.video_urls ? { list: createReviewDto.video_urls } : undefined,
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

    async getReviews(productId: number, getReviewsDto: GetReviewsDto): Promise<{ reviews: Review[], nextCursor?: string }> {
        try {
            const result = await firstValueFrom(this.productGrpcService.listReviews({
                product_id: productId,
                pagination: PaginationMapper.toGrpcSimpleCursorPaginationRequest({
                    sort_by: getReviewsDto.sort_by,
                    order: getReviewsDto.order,
                    limit: getReviewsDto.limit,
                    cursor: getReviewsDto.cursor
                }),
                rating_filter: getReviewsDto.rating_filter
            }));
            return {
                reviews: result.reviews.map((value) => ReviewMapper.fromGrpcReview(value)),
                nextCursor: result.pagination.next_cursor
            };
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getReviewOverview(productId: number): Promise<RatingStatsDto> {
        try {
            const result = await firstValueFrom(this.productGrpcService.getReviewOverview({
                product_id: productId
            }));
            return {
                totalCount: result.total_count,
                totalRating: result.total_ratings,
                averageRating: result.average_rating,
                ratings: result.rating_overview
            }
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}
