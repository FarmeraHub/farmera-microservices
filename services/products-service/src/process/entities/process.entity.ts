import { ProcessStage } from "src/common/enums/process-stage.enum";
import { Product } from "src/products/entities/product.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("process")
export class Process {
    @PrimaryGeneratedColumn("increment", { name: "process_id" })
    process_id: number;

    @ManyToOne(() => Product, (product) => product.processes)
    @JoinColumn({ name: "product_id" })
    product: Product;

    @Column({
        type: "enum",
        enum: ProcessStage,
        nullable: false,
        name: "stage_name"
    })
    stage_name: ProcessStage;

    @Column({ type: "jsonb", nullable: false, name: "description" })
    description: Record<string, string>;

    @Column({ type: "text", array: true, nullable: false, name: "image_cids" })
    image_urls: string[];

    @Column({ type: "text", array: true, nullable: true, name: "video_cids" })
    video_urls: string[] | null;

    @Column({ type: "date", nullable: false, name: "start_date" })
    start_date: Date;

    @Column({ type: "date", nullable: true, name: "end_date" })
    end_date: Date;

    @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, name: "latitude" })
    latitude: number

    @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, name: "longitude" })
    longitude: number

    @CreateDateColumn({ type: "timestamptz", nullable: false })
    created: Date;
}