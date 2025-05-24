import { SubOrder } from "src/orders/entities/sub-order.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToOne,  PrimaryGeneratedColumn } from "typeorm";

@Entity('order_detail')
export class OrderDetail{
    @PrimaryGeneratedColumn('increment')
    order_detail_id: number;

    @Column()
    product_id: number;

    @Column()
    prodcut_name: string;

    @Column()
    quantity: number;
    @Column()
    price_per_unit: number;
    @Column()
    unit: number;

    @ManyToOne(() =>SubOrder)
    sub_order_id: SubOrder;
}