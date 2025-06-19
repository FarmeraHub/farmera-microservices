import { IsNotEmpty, IsString } from "class-validator";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Review } from "./review.entity";

@Entity("review_reply")
export class ReviewReply {
    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column({ type: "uuid", name: "user_id", nullable: false })
    user_id: string;

    @Column({ type: "text", nullable: false })
    @IsString()
    @IsNotEmpty()
    reply: string;

    @CreateDateColumn({ type: "timestamptz", nullable: false })
    created: Date;

    @Column({ default: false, name: "is_deleted", nullable: false })
    is_deleted: boolean;

    @ManyToOne(() => Review, (review) => review.replies)
    review: Review;
}