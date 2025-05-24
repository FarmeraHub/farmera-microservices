import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('category')
export class Category {
    @PrimaryGeneratedColumn()
    category_id: number;
    @Column()
    name: string;
    @Column({ type: 'text', nullable: true })
    description: string;
    @Column()
    image_url: string;
    @CreateDateColumn()
    createdAt: Date;
}