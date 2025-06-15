import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Category } from "./category.entity";

@Entity('subcategory')
export class Subcategory {
    @PrimaryGeneratedColumn()
    subcategory_id: number;
    @Column()
    name: string;
    @Column({ type: 'text', nullable: true })
    description: string;
    @CreateDateColumn({ type: "timestamptz" })
    created: Date;
    @ManyToOne(() => Category, { nullable: false })
    @JoinColumn({ name: 'category_id' })
    category: Category;
}