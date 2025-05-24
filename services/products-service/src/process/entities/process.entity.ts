import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("process")
export class Process {
    @PrimaryGeneratedColumn("increment", { name: "process_id" })
    processId: number;

    @Column({ type: "uuid", nullable: false, name: "product_id" })
    productId: string;

    @Column({ type: "text", nullable: false, name: "stage_name" })
    stageName: string;

    @Column({ type: "jsonb", nullable: false, name: "description" })
    description: Record<string, string>;

    @Column({ type: "text", array: true, nullable: false, name: "image_cids" })
    imageCids: string[];

    @Column({ type: "text", array: true, nullable: true, name: "video_cids" })
    videoCids: string[] | null;

    @Column({ type: "date", nullable: false, name: "start_date" })
    startDate: Date;

    @Column({ type: "date", nullable: true, name: "end_date" })
    endDate: Date;

    @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, name: "latitude" })
    latitude: number

    @Column({ type: "numeric", precision: 9, scale: 6, nullable: true, name: "longitude" })
    longitude: number

    @CreateDateColumn({ type: "timestamptz", nullable: false })
    created: Date;
}