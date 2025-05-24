import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { ReviewReply } from './entities/review-reply.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { SavedFileResult } from 'src/file-storage/storage.strategy.interface';
import { CreateReplyDto } from './dto/create-reply.dto';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReviewsService {

    private readonly logger = new Logger(ReviewsService.name);

    constructor(
        @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
        @InjectRepository(ReviewReply) private readonly replyRepository: Repository<ReviewReply>,
        private readonly fileStorageService: FileStorageService,
        private httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async createReview(
        createReviewDto: CreateReviewDto,
        userId: string,
        files?: {
            review_images?: Express.Multer.File[],
            review_videos?: Express.Multer.File[]
        }
    ): Promise<Review> {
        let savedImageResults: SavedFileResult[] = [];
        let savedVideoResults: SavedFileResult[] = [];

        try {
            // validate images & videos
            if (files?.review_images?.length) {
                savedImageResults = await this.fileStorageService.saveFiles(files.review_images, 'review_images');
            }

            if (files?.review_videos?.length) {
                savedVideoResults = await this.fileStorageService.saveFiles(files.review_videos, 'review_videos');
            }

            // get images & videos result urls, or null if none
            const imageUrls = savedImageResults.length > 0 ? savedImageResults.map(r => r.url) : null;
            const videoUrls = savedVideoResults.length > 0 ? savedVideoResults.map(r => r.url) : null;

            this.logger.debug(imageUrls, videoUrls);

            // !TODO()
            // cache

            // check if user has purchased the product
            // const orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL');
            // const productId = createReviewDto.productId;

            // const response = await firstValueFrom(
            //     this.httpService.get(`${orderServiceUrl}/orders/check-purchased`, {
            //         params: { userId, productId }
            //     })
            // );

            // const { orderDetailId } = response.data;

            // if (!orderDetailId) {
            //     throw new BadRequestException('Không thể đánh giá sản phẩm khi chưa mua');
            // }
            const orderDetailId = 0;

            const review = this.reviewRepository.create(createReviewDto);
            review.userId = userId;
            review.imageUrls = imageUrls;
            review.videoUrls = videoUrls;
            review.orderDetailId = orderDetailId;
            review.created = new Date();

            return await this.reviewRepository.save(review);
        } catch (error) {
            this.logger.error(error);

            // clean up files
            const resultsToCleanup = [...savedImageResults, ...savedVideoResults];
            if (resultsToCleanup.length > 0) {
                await this.fileStorageService.cleanupFiles(resultsToCleanup);
            }

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(`Không thể đánh giá`);
        }
    }


    async createReply(
        createReplyDto: CreateReplyDto,
        userId: string
    ): Promise<ReviewReply> {
        try {
            const review = await this.reviewRepository.findOne({
                where: { reviewId: createReplyDto.reviewId }
            });

            if (review) {
                // !TODO()
                // cache
                // check if user has purchased the product

                const reply = this.replyRepository.create({
                    reply: createReplyDto.reply,
                    review: review,
                    userId: userId
                });

                return await this.replyRepository.save(reply);
            }
            this.logger.debug("review not found");
            throw new NotFoundException("Đánh giá không tồn tại");
        }
        catch (error) {
            this.logger.error(error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể phản hồi đánh giá`);
        }
    }

    async getReviewsByCursor(
        productId: number,
        sortBy: 'created' | 'rating' = 'created',
        order: 'ASC' | 'DESC' = 'DESC',
        limit = 10,
        cursor: string,
    ) {
        const qb = this.reviewRepository.createQueryBuilder('review')
            .leftJoinAndSelect('review.replies', 'reply', 'reply.is_deleted = false')
            .where('review.is_deleted = false')
            .andWhere('review.product_id = :productId', { productId })
            .limit(limit);

        if (sortBy === 'created') {
            qb.orderBy('review.created', order);
        } else {
            qb.orderBy('review.rating', order).addOrderBy('review.created', order);
        }

        if (cursor) {
            if (sortBy === 'created') {
                if (order === 'DESC') {
                    qb.andWhere('review.created < :cursor', { cursor });
                } else {
                    qb.andWhere('review.created > :cursor', { cursor });
                }
            } else {
                // cursor: "<rating>_<created>"
                const [ratingStr, created] = cursor.split('_');
                const rating = parseInt(ratingStr);

                if (order === 'DESC') {
                    qb.andWhere('(review.rating < :rating OR (review.rating = :rating AND review.created < :created))', {
                        rating,
                        created,
                    });
                } else {
                    qb.andWhere('(review.rating > :rating OR (review.rating = :rating AND review.created > :created))', {
                        rating,
                        created,
                    });
                }
            }
        }

        const reviews = await qb.getMany();

        // create next cursor
        let nextCursor: string | null = null;
        if (reviews.length === limit) {
            const lastReview = reviews[reviews.length - 1];
            if (sortBy === 'created') {
                nextCursor = `${new Date(lastReview.created).toISOString()}`;
            } else {
                nextCursor = `${lastReview.rating}_${new Date(lastReview.created).toISOString()}`;
            }
        }

        return {
            data: {
                reviews,
                nextCursor,
            },
        };
    }

    async getReviewsByOffset(
        productId: number,
        sortBy: 'created' | 'rating' = 'created',
        order: 'ASC' | 'DESC' = 'DESC',
        limit = 10,
        page = 1,
    ) {
        const offset = (page - 1) * limit;

        const qb = this.reviewRepository
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.replies', 'reply', 'reply.is_deleted = false')
            .where('review.is_deleted = false')
            .andWhere('review.product_id = :productId', { productId });

        if (sortBy === 'created') {
            qb.orderBy('review.created', order);
        } else {
            qb.orderBy('review.rating', order).addOrderBy('review.created', order);
        }

        // getMany + total count in one query
        const [reviews, total] = await qb
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data: {
                reviews,
                total,
                totalPages,
                page,
                limit,
                nextPage: page < totalPages ? page + 1 : null,
                previousPage: page > 1 ? page - 1 : null,
            },
        };
    }

    async deleteReview(reviewId: number, userId: string) {
        const result = await this.reviewRepository.update({ reviewId: reviewId, userId: userId }, { isDeleted: true });
        if (result.affected == 0) {
            throw new NotFoundException(`Không tìm thấy review`);
        }

        return {
            message: 'Xoá thành công',
            data: null,
        };

    }

    async deleteReply(replyId: number, userId: string) {
        const result = await this.replyRepository.update({ id: replyId, userId: userId }, { isDeleted: true });
        if (result.affected == 0) {
            throw new NotFoundException(`Không tìm thấy reply`);
        }

        return {
            message: 'Xoá thành công',
            data: null,
        };
    }

    async approveReview(reviewId: number, approve: boolean) {
        const result = await this.reviewRepository.update({ reviewId: reviewId }, { sellerApproved: approve });
        if (result.affected == 0) {
            throw new NotFoundException(`Không tìm thấy reply`);
        }

        return {
            message: 'Thành công',
            data: null,
        };
    }

    async updateReview(
        reviewId: number,
        comment: string,
        userId: string,
        files?: {
            review_images?: Express.Multer.File[],
            review_videos?: Express.Multer.File[]
        }
    ) {
        let savedImageResults: SavedFileResult[] = [];
        let savedVideoResults: SavedFileResult[] = [];

        try {
            const existingReview = await this.reviewRepository.findOneBy({
                reviewId,
                userId,
            });

            if (!existingReview) {
                throw new NotFoundException('Không tìm thấy review');
            }

            // validate images & videos
            if (files?.review_images?.length) {
                savedImageResults = await this.fileStorageService.saveFiles(files.review_images, 'review_images');
            }

            if (files?.review_videos?.length) {
                savedVideoResults = await this.fileStorageService.saveFiles(files.review_videos, 'review_videos');
            }

            // get images & videos result urls, or null if none
            const imageUrls = savedImageResults.length > 0
                ? savedImageResults.map(r => r.url)
                : existingReview.imageUrls;

            const videoUrls = savedVideoResults.length > 0
                ? savedVideoResults.map(r => r.url)
                : existingReview.videoUrls;

            const result = await this.reviewRepository.update(
                { reviewId: reviewId, userId: userId },
                {
                    comment,
                    imageUrls,
                    videoUrls,
                }
            );


            if (result.affected == 0) {
                throw new NotFoundException(`Không tìm thấy reply`);
            }

            return {
                message: 'Thành công',
                data: null,
            };
        } catch (error) {
            this.logger.error(error);

            // clean up files
            const resultsToCleanup = [...savedImageResults, ...savedVideoResults];
            if (resultsToCleanup.length > 0) {
                await this.fileStorageService.cleanupFiles(resultsToCleanup);
            }

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(`Không thể đánh giá`);
        }
    }

    async updateReply(
        replyId: number,
        reply: string,
        userId: string,
    ) {
        const result = await this.replyRepository.update({ id: replyId, userId: userId }, { reply: reply });
        if (result.affected == 0) {
            throw new NotFoundException(`Không tìm thấy reply`);
        }

        return {
            message: 'Thành công',
            data: null,
        };
    }
}
