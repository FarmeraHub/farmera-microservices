import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Subcategory } from "./subcategory.entity";

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
    @CreateDateColumn({ type: "timestamptz" })
    created: Date;
    @OneToMany(() => Subcategory, (sub) => sub.category)
    subcategories: Subcategory[];
}