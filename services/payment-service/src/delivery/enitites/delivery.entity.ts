import { DeliveryStatus } from "src/common/enums/delivery.enum";
import { SubOrder } from "src/orders/entities/sub-order.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('delivery')
export class Delivery { 
    @PrimaryGeneratedColumn('increment')
    delivery_id: number;
    @Column({
        type:'enum',
        enum: DeliveryStatus,
        default: DeliveryStatus.PENDING,
    })
    status: DeliveryStatus;
    @Column()
    total_cost: number;
    @Column()
    discount_amount: number;
    @Column()
    shipping_amount: number;
    @Column()
    ship_date: Date;
    @CreateDateColumn()
    created: Date;
    @UpdateDateColumn()
    updated: Date;
    @OneToOne(() => SubOrder) 
    @JoinColumn({ name: 'sub_order_id' })
    sub_order_id: SubOrder;
}