import { Body, Controller, Post, UploadedFiles, UseInterceptors, Headers, Delete, Param, Get, Query, Patch } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { GetReviewsDto } from './dto/get-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewService: ReviewsService) { }

    @Post()
    async createReview(
        @Headers("x-user-id") userId: string,
        @Body() createReviewDto: CreateReviewDto,
    ) {
        return await this.reviewService.createReview(createReviewDto, userId);
    }

    @Post("/reply")
    async createReply(
        @Headers("x-user-id") userId: string,
        @Body() createReplyDto: CreateReplyDto,
    ) {
        return await this.reviewService.createReply(createReplyDto, userId);
    }

    @Get("cursor")
    async getReviewsByCursor(
        @Query() query: GetReviewsDto
    ) {
        return await this.reviewService.getReviewsByCursor(
            query.product_id,
            query.sort_by,
            query.order,
            query.limit,
            query.cursor
        );
    }

    @Get("offset")
    async getReviewsByOffset(
        @Query() query: GetReviewsDto
    ) {
        return await this.reviewService.getReviewsByOffset(
            query.product_id,
            query.sort_by,
            query.order,
            query.limit,
            query.page
        )
    }

    @Delete(":id")
    async deleteReview(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return await this.reviewService.deleteReview(parseInt(id), userId);
    }

    @Delete("/reply/:id")
    async deleteReply(
        @Param("id") id: string,
        @Headers("x-user-id") userId: string,
    ) {
        return await this.reviewService.deleteReply(parseInt(id), userId);
    }

    // !TODO: validate seller role
    @Patch("/approve/:id")
    async approveReview(@Param("id") id: number, @Body() body: { status: boolean }) {
        return await this.reviewService.approveReview(id, body.status);
    }

    @Patch(":id")
    async updateReview(
        @Headers("x-user-id") userId: string,
        @Param("id") id: number,
        @Body() updateReviewDto: UpdateReviewDto
    ) {
        return await this.reviewService.updateReview(id, updateReviewDto, userId);
    }

    @Patch("/reply/:id")
    async updateReply(
        @Headers("x-user-id") userId: string,
        @Param("id") id: number,
        @Body() body: { reply: string },
    ) {
        return await this.reviewService.updateReply(id, body.reply, userId);
    }
}
