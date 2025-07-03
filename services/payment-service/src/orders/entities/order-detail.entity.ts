
import { SubOrder } from "src/orders/entities/sub-order.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToOne,  PrimaryGeneratedColumn } from "typeorm";

@Entity('order_detail')
export class OrderDetail{
    @PrimaryGeneratedColumn('increment')
    order_detail_id: number;

    @Column()
    product_id: number;

    @Column()
    product_name: string;

    @Column()
    quantity: number;
    @Column()
    price_per_unit: number;
    @Column()
    unit: string;

    @ManyToOne(() => SubOrder)
    @JoinColumn({ name: 'sub_order' })
    sub_order: SubOrder;

    @Column()
    weight: number;

    @Column()
    image_url: string;

    @Column()
    total_price: number;

    


}