import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { ReviewReply } from './entities/review-reply.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { AzureBlobService } from 'src/services/azure-blob.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ErrorMapper } from 'src/grpc/server/mappers/common/error.mapper';
import { RatingStatsDto } from './dto/rating-stat.dto';

@Injectable()
export class ReviewsService {

    private readonly logger = new Logger(ReviewsService.name);

    constructor(
        @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
        @InjectRepository(ReviewReply) private readonly replyRepository: Repository<ReviewReply>,
        private readonly fileStorageService: AzureBlobService,
    ) { }

    async createReview(
        createReviewDto: CreateReviewDto,
        userId: string,
    ): Promise<Review> {
        try {
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

            review.user_id = userId;
            review.order_detailId = orderDetailId;
            review.created = new Date();

            return await this.reviewRepository.save(review);

        } catch (error) {
            this.logger.error(error.message);
            throw new InternalServerErrorException(`Không thể đánh giá`);
        }
    }


    async createReply(
        createReplyDto: CreateReplyDto,
        userId: string
    ): Promise<ReviewReply> {
        try {
            const review = await this.reviewRepository.findOne({
                where: { review_id: createReplyDto.review_id, is_deleted: false }
            });

            if (review) {
                // !TODO()
                // cache
                // check if user has purchased the product

                const reply = this.replyRepository.create({
                    reply: createReplyDto.reply,
                    review: review,
                    user_id: userId
                });

                return await this.replyRepository.save(reply);
            }
            this.logger.debug("review not found");
            throw new NotFoundException("Đánh giá không tồn tại");
        }
        catch (error) {
            this.logger.error(error.message);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể phản hồi đánh giá`);
        }
    }

    async getReviewsByCursor(
        productId: number,
        sortBy: string,
        order: 'ASC' | 'DESC' = 'DESC',
        limit = 10,
        cursor: string,
        raingFilter?: number,
    ) {
        const validSortBy = ['created', 'rating'];
        if (!validSortBy.includes(sortBy)) {
            throw new BadRequestException('Valid sort by: created, rating');
        }

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

        if (raingFilter) {
            qb.andWhere('review.rating = :rating', { rating: raingFilter });
        }

        if (cursor) {
            const decoded = this.decodeCursor(cursor);
            if (sortBy === 'created') {
                if (order === 'DESC') {
                    qb.andWhere('review.created < :decoded', { decoded });
                } else {
                    qb.andWhere('review.created > :decoded', { decoded });
                }
            } else {
                // cursor: "<rating>_<created>"
                const [ratingStr, created] = decoded.split('_');
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

        if (nextCursor) {
            nextCursor = this.encodeCursor(nextCursor);
        }

        return {
            data: {
                reviews,
                nextCursor
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
        try {
            const result = await this.reviewRepository.update({ review_id: reviewId, user_id: userId }, { is_deleted: true });
            if (result.affected == 0) {
                throw new NotFoundException(`Không tìm thấy review`);
            }
            return true;
        }
        catch (err) {
            throw ErrorMapper.toRpcException(err);
        }
    }

    async deleteReply(replyId: number, userId: string) {
        try {
            const result = await this.replyRepository.update({ id: replyId, user_id: userId }, { is_deleted: true });
            if (result.affected == 0) {
                throw new NotFoundException(`Không tìm thấy reply`);
            }
            return true;
        }
        catch (err) {
            throw ErrorMapper.toRpcException(err);
        }
    }

    async approveReview(reviewId: number, approve: boolean) {
        try {
            const result = await this.reviewRepository.update({ review_id: reviewId }, { seller_approved: approve });
            if (result.affected == 0) {
                throw new NotFoundException(`Không tìm thấy review`);
            }
            return true
        }
        catch (err) {
            throw ErrorMapper.toRpcException(err);
        }
    }

    async updateReview(reviewId: number, updateReviewDto: UpdateReviewDto, userId: string) {
        try {
            const existingReview = await this.reviewRepository.findOneBy({
                review_id: reviewId,
                user_id: userId,
            });


            if (!existingReview) {
                throw new NotFoundException('Không tìm thấy review');
            }

            const deleteImgUrls = existingReview.image_urls?.filter((value) => !updateReviewDto.image_urls?.includes(value));
            const deleteVideoUrls = existingReview.video_urls?.filter((value) => !updateReviewDto.video_urls?.includes(value));

            const failedDeletes: string[] = [];

            // delete images
            if (deleteImgUrls?.length) {
                const imgResults = await Promise.allSettled(
                    deleteImgUrls.map((url) => this.fileStorageService.deleteFile(url))
                );

                imgResults.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        this.logger.error(`Failed to delete image: ${deleteImgUrls[index]}`);
                        failedDeletes.push(deleteImgUrls[index]);
                    }
                });
            }

            // delete videos
            if (deleteVideoUrls?.length) {
                const videoResults = await Promise.allSettled(
                    deleteVideoUrls.map((url) => this.fileStorageService.deleteFile(url))
                );

                videoResults.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        this.logger.error(`Failed to delete video: ${deleteVideoUrls[index]}`);
                        failedDeletes.push(deleteVideoUrls[index]);
                    }
                });
            }

            existingReview.rating = updateReviewDto.rating;
            existingReview.comment = updateReviewDto.comment;
            existingReview.image_urls = updateReviewDto.image_urls ? updateReviewDto.image_urls : null;
            existingReview.video_urls = updateReviewDto.video_urls ? updateReviewDto.video_urls : null;

            const result = await this.reviewRepository.save(existingReview);

            return result;

        } catch (error) {
            this.logger.error(error.message);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không cập nhật thể đánh giá`);
        }
    }

    async updateReply(replyId: number, reply: string, userId: string) {
        const result = await this.replyRepository.findOne({ where: { id: replyId, user_id: userId } });
        if (!result) {
            throw new NotFoundException(`Không tìm thấy reply`);
        }
        result.reply = reply;
        return await this.replyRepository.save(result);
    }

    private encodeCursor(payload: string): string {
        return Buffer.from(payload).toString('base64');
    }

    private decodeCursor(cursor: string): string {
        try {
            return Buffer.from(cursor, 'base64').toString('utf8');
        } catch (err) {
            throw new BadRequestException('Invalid cursor');
        }
    }

    async getReviewOverview(productId: number): Promise<RatingStatsDto> {
        const ratings = await this.reviewRepository.createQueryBuilder('review')
            .select('review.rating', 'rating')
            .addSelect('review.rating', 'rating')
            .addSelect('COUNT(*)', 'count')
            .where('review.is_deleted = false')
            .andWhere('review.product_id = :productId', { productId })
            .groupBy('review.rating')
            .getRawMany();

        const counts: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };

        for (const row of ratings) {
            const rating = Number(row.rating);
            const count = Number(row.count);
            counts[rating] = count;
        }
        return new RatingStatsDto(counts);
    }
}
