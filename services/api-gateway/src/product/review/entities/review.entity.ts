import { ReviewReply } from "./review-reply.entity";

export class Review {
    review_id: number;
    product_id: number;
    user_id: string;
    rating: number;
    comment: string;
    image_urls: string[] | null;
    video_urls: string[] | null;
    seller_approved: boolean;
    created: Date;
    order_detail_id: number;
    replies?: ReviewReply[];
}