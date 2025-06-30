import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse, ApiQuery } from '@nestjs/swagger';
import { Review } from './entities/review.entity';
import { ReviewReply } from './entities/review-reply.entity';
import { SimpleCursorPagination } from 'src/pagination/dto/pagination-options.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { GetReviewsDto } from './dto/get-review.dto';
import { RatingStatsDto } from './dto/rating-stat.dto';

@ApiTags('Review')
@Controller('review')
export class ReviewController {

    constructor(private readonly reviewServie: ReviewService) { }

    @Post()
    @ApiOperation({ summary: 'Create a review', description: 'Creates a new review for a product.' })
    @ApiBody({ type: CreateReviewDto })
    @ApiResponse({ status: 201, description: 'Review created successfully', type: Review })
    @ApiBadRequestResponse({ description: 'Invalid input or creation failed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async createReview(@User() user: UserInterface, @Body() createReviewDto: CreateReviewDto) {
        return await this.reviewServie.createReview(createReviewDto, user.id);
    }

    @Post("reply")
    @ApiOperation({ summary: 'Create a reply to a review', description: 'Creates a reply to a review.' })
    @ApiBody({ type: CreateReplyDto })
    @ApiResponse({ status: 201, description: 'Reply created successfully', type: ReviewReply })
    @ApiBadRequestResponse({ description: 'Invalid input or creation failed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async createReply(@User() user: UserInterface, @Body() createReplyDto: CreateReplyDto) {
        return await this.reviewServie.createReply(createReplyDto, user.id);
    }

    @Patch(":review_id")
    @ApiOperation({ summary: 'Update a review', description: 'Updates an existing review.' })
    @ApiParam({ name: 'review_id', description: 'ID of the review to update' })
    @ApiBody({ type: UpdateReviewDto })
    @ApiResponse({ status: 200, description: 'Review updated successfully', type: Review })
    @ApiBadRequestResponse({ description: 'Invalid input or update failed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Review not found' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async updateReview(@User() user: UserInterface, @Param("review_id") reviewId: number, @Body() updateReviewDto: UpdateReviewDto) {
        return await this.reviewServie.updateReview(updateReviewDto, user.id, reviewId);
    }

    @Patch("reply/:reply_id")
    @ApiOperation({ summary: 'Update a reply', description: 'Updates an existing reply to a review.' })
    @ApiParam({ name: 'reply_id', description: 'ID of the reply to update' })
    @ApiBody({ schema: { type: 'object', properties: { reply: { type: 'string' } } } })
    @ApiResponse({ status: 200, description: 'Reply updated successfully', type: ReviewReply })
    @ApiBadRequestResponse({ description: 'Invalid input or update failed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Reply not found' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async updateReply(@User() user: UserInterface, @Param("reply_id") replyId: number, @Body() body: { reply: string }) {
        return await this.reviewServie.updateReply(replyId, body.reply, user.id);
    }

    @Delete(":review_id")
    @ApiOperation({ summary: 'Delete a review', description: 'Deletes a review.' })
    @ApiParam({ name: 'review_id', description: 'ID of the review to delete' })
    @ApiResponse({ status: 200, description: 'Review deleted successfully', type: Boolean })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Review not found' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async deleteReview(@User() user: UserInterface, @Param("review_id") reviewId: number) {
        return await this.reviewServie.deleteReview(reviewId, user.id);
    }

    @Delete("reply/:reply_id")
    @ApiOperation({ summary: 'Delete a reply', description: 'Deletes a reply to a review.' })
    @ApiParam({ name: 'reply_id', description: 'ID of the reply to delete' })
    @ApiResponse({ status: 200, description: 'Reply deleted successfully', type: Boolean })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiNotFoundResponse({ description: 'Reply not found' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async deleteReply(@User() user: UserInterface, @Param("reply_id") replyId: number) {
        return await this.reviewServie.deleteReply(replyId, user.id);
    }

    @Public()
    @Get("overview/:product_id")
    @ApiOperation({ summary: 'Get review overview', description: 'Gets review overview for a product.' })
    @ApiParam({ name: 'product_id', description: 'ID of the product to get review overview for' })
    @ApiResponse({ status: 200, description: 'Review overview retrieved successfully', type: RatingStatsDto })
    @ApiBadRequestResponse({ description: 'Invalid input or retrieval failed' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async getReviewOverview(@Param("product_id") productId: number) {
        return await this.reviewServie.getReviewOverview(productId);
    }

    @Post("approve/:review_id")
    @ApiOperation({ summary: 'Approve a review', description: 'Approves or disapproves a review.' })
    @ApiParam({ name: 'review_id', description: 'ID of the review to approve/disapprove' })
    @ApiBody({ schema: { type: 'object', properties: { approve: { type: 'boolean' } } } })
    @ApiResponse({ status: 200, description: 'Review approval status updated', type: Boolean })
    @ApiBadRequestResponse({ description: 'Invalid input or approval failed' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async approveReview(@Param("review_id") review_id: number, @Body() body: { approve: boolean }) {
        return await this.reviewServie.approveReview(review_id, body.approve);
    }

    @Public()
    @Get(":product_id")
    @ApiOperation({ summary: 'Get reviews', description: 'Gets reviews for a product.' })
    @ApiParam({ name: 'product_id', description: 'ID of the product to get reviews for' })
    @ApiQuery({ type: GetReviewsDto })
    @ApiResponse({ status: 200, description: 'Reviews retrieved successfully', type: [Review] })
    @ApiBadRequestResponse({ description: 'Invalid input or retrieval failed' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async getReviews(@Param("product_id") productId: number, @Query() pagination: GetReviewsDto) {
        return await this.reviewServie.getReviews(productId, pagination);
    }
}
