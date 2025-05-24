import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";
import { Subcategory } from "src/categories/entities/subcategory.entity";

@Entity('product_subcategory_detail')
export class ProductSubcategoryDetail {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(()=>Product,{nullable:false})
    @JoinColumn({name:'product_id'})
    product: Product;

    @ManyToOne(()=> Subcategory,{nullable:false})
    @JoinColumn({name:'subcategory_id'})
    subcategory: Subcategory;

}
