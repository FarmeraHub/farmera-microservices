import { Discount } from "src/discounts/entities/discount.entity";
import { Order } from "src/orders/entities/order.entity";
import { Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('discount_usage')
export class DiscountUsage { 
    @PrimaryGeneratedColumn('increment')
    discount_usage_id: number;

    @ManyToOne(() => Discount)
    @JoinColumn({ name: 'discount_id' })
    discount_id: Discount;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order_id: Order;
}