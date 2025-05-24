import { Column, Entity, JoinColumn, ManyToOne, OneToOne, Or, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { SubOrderStatus } from "src/common/enums/sub-order-status.enum";
import { Delivery } from "src/delivery/enitites/delivery.entity";

@Entity('sub_order')
export class SubOrder {
    @PrimaryGeneratedColumn('increment')
    sub_order_id: number;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order_id: Order;

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
    @Column()
    created: Date;
    @OneToOne(() => Delivery)
    delivery_id: Delivery;

}