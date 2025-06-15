import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('review')
export class ReviewController {

    constructor(private readonly reviewServie: ReviewService) { }

    @Post()
    async createReview(@User() user: UserInterface, @Body() createReviewDto: CreateReviewDto) {
        return await this.reviewServie.createReview(createReviewDto, user.id);
    }

    @Post("reply")
    async createReply(@User() user: UserInterface, @Body() createReplyDto: CreateReplyDto) {
        return await this.reviewServie.createReply(createReplyDto, user.id);
    }

    @Patch(":review_id")
    async updateReview(@User() user: UserInterface, @Param("review_id") reviewId: number, @Body() updateReviewDto: UpdateReviewDto) {
        return await this.reviewServie.updateReview(updateReviewDto, user.id, reviewId);
    }

    @Patch("reply/:reply_id")
    async updateReply(@User() user: UserInterface, @Param("reply_id") replyId: number, @Body() body: { reply: string }) {
        return await this.reviewServie.updateReply(replyId, body.reply, user.id);
    }

    @Delete(":review_id")
    async deleteReview(@User() user: UserInterface, @Param("review_id") reviewId: number) {
        return await this.reviewServie.deleteReview(reviewId, user.id);
    }

    @Delete("reply/:reply_id")
    async deleteReply(@User() user: UserInterface, @Param("reply_id") replyId: number) {
        return await this.reviewServie.deleteReply(replyId, user.id);
    }

    @Post("approve/:review_id")
    async approveReview(@Param("review_id") review_id: number, @Body() body: { approve: boolean }) {
        return await this.reviewServie.approveReview(review_id, body.approve);
    }
}
