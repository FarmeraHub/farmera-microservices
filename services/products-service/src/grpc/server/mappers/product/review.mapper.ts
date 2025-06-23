import { Review as GrpcReview, ReviewReply as GrpcReviewReply } from "@farmera/grpc-proto/dist/products/products";
import { Review } from "src/reviews/entities/review.entity";
import { TypesMapper } from "../common/types.mapper";
import { ReviewReply } from "src/reviews/entities/review-reply.entity";

export class ReviewMapper {
    static toGrpcReview(value: Review): GrpcReview {
        return {
            review_id: value.review_id,
            product_id: value.product_id,
            user_id: value.user_id,
            rating: value.rating,
            comment: value.comment,
            images_urls: value.image_urls ? { list: value.image_urls } : undefined,
            video_urls: value.video_urls ? { list: value.video_urls } : undefined,
            seller_approved: value.seller_approved,
            created: TypesMapper.toGrpcTimestamp(value.created),
            order_detail_id: value.order_detailId,
            replies: value.replies ? { replies: value.replies.map((v) => this.toGrpcReply(v)) } : undefined,
        }
    }

    static toGrpcReply(value: ReviewReply): GrpcReviewReply {
        return {
            id: value.id,
            user_id: value.user_id,
            reply: value.reply,
            created: TypesMapper.toGrpcTimestamp(value.created),
        }
    }
}