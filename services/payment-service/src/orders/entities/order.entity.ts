
import { DiscountUsage } from "src/discounts/entities/discount-usage.entity";
import { Payment } from "src/payments/entities/payment.entity";
import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SubOrder } from "./sub-order.entity";
import { OrderStatus } from "src/common/enums/payment/order-status.enum";

@Entity('order')
export class Order {
    @PrimaryGeneratedColumn('increment')
    order_id: number;

    @Column({ name: 'customer_id', type: 'uuid' })
    customer_id: string;

    @Column()
    address_id: string;

    @Column()
    total_amount: number;

    @Column()
    discount_amount: number;

    @Column()
    shipping_amount: number;

    @Column()
    final_amount: number;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;


    @OneToMany(() => DiscountUsage, (discountUsage) => discountUsage.order_id, { cascade: true })
    discount_usage: DiscountUsage[];
    @OneToOne(() => Payment)
    payment: Payment;
    @OneToMany(() => SubOrder, (subOrder) => subOrder.order, { cascade: true })
    sub_orders: SubOrder[];

    @Column()
    currency: string;
    @Column({
            type: 'enum',
            enum: OrderStatus,
            default: OrderStatus.PENDING,
        })
        status: OrderStatus;
}   