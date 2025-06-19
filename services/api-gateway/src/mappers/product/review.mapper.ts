import { Review as GrpcReview, ReviewReply as GrpcReviewReply } from "@farmera/grpc-proto/dist/products/products";
import { Review } from "src/product/review/entities/review.entity";
import { TypesMapper } from "../common/types.mapper";
import { ReviewReply } from "src/product/review/entities/review-reply.entity";

export class ReviewMapper {
    static fromGrpcReview(value: GrpcReview): Review {
        return {
            review_id: value.review_id,
            product_id: value.product_id,
            user_id: value.user_id,
            rating: value.rating,
            comment: value.comment,
            image_urls: value.images_urls ? value.images_urls.list : null,
            video_urls: value.video_urls ? value.video_urls.list : null,
            seller_approved: value.seller_approved,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            order_detail_id: value.order_detail_id,
            replies: value.replies ? value.replies.replies.map((val) => this.fromGrpcReply(val)) : undefined,
        }
    }

    static fromGrpcReply(value: GrpcReviewReply): ReviewReply {
        return {
            id: value.id,
            user_id: value.user_id,
            reply: value.reply,
            created: TypesMapper.fromGrpcTimestamp(value.created),
        }
    }
}