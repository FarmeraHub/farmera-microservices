import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, ManyToMany } from "typeorm";
import { Category } from "./category.entity";
import { Product } from "src/products/entities/product.entity";

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

    @ManyToMany(() => Product, (product) => product.subcategories)
    products?: Product[]
}