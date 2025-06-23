import { IsNotEmpty, IsString, Max, Min } from "class-validator";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ReviewReply } from "./review-reply.entity";

@Entity("reviews")
export class Review {
    @PrimaryGeneratedColumn("increment", { name: "review_id" })
    review_id: number;

    @Column({ name: "product_id", nullable: false })
    product_id: number;

    @Column({ type: "uuid", name: "user_id", nullable: false })
    user_id: string;

    @Column({ nullable: false })
    @Min(1)
    @Max(5)
    rating: number;

    @Column({ type: "text", nullable: false })
    @IsString()
    @IsNotEmpty()
    comment: string;

    @Column("text", { array: true, name: "image_urls", nullable: true })
    image_urls: string[] | null;

    @Column("text", { array: true, name: "video_urls", nullable: true })
    video_urls: string[] | null;

    @Column({ default: false, name: "seller_approved", nullable: false })
    seller_approved: boolean;

    @CreateDateColumn({ type: "timestamptz", nullable: false })
    created: Date;

    @Column({ default: false, name: "is_deleted", nullable: false })
    is_deleted: boolean;

    @Column({ name: "order_detail_id", nullable: false })
    order_detailId: number;

    @OneToMany(() => ReviewReply, (reply) => reply.review)
    replies: ReviewReply[];
}