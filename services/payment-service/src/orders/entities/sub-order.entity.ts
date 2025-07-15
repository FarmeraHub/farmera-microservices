import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, Or, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { SubOrderStatus } from "src/common/enums/payment/sub-order-status.enum";
import { Delivery } from "src/delivery/enitites/delivery.entity";
import { OrderDetail } from "./order-detail.entity";

@Entity('sub_order')
export class SubOrder {
    @PrimaryGeneratedColumn('increment')
    sub_order_id: number;

    @ManyToOne(() => Order, (order) => order.sub_orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'farm_id', type: 'uuid' })
    farm_id: string;

    @Column({
        type: 'enum',
        enum: SubOrderStatus,
        default: SubOrderStatus.PENDING,
    })
    status: SubOrderStatus;
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
    @OneToOne(() => Delivery, (delivery) => delivery.sub_order, { cascade: true })
    delivery: Delivery;
    @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.sub_order, { cascade: true })
    order_details: OrderDetail[];

    @Column()
    currency: string;

    @Column()
    avatar_url: string;
    @Column()
    notes: string;


}