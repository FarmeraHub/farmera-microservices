import { DeliveryStatus } from "src/common/enums/payment/delivery.enum";
import { SubOrder } from "src/orders/entities/sub-order.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('delivery')
export class Delivery {
    @PrimaryGeneratedColumn('increment')
    delivery_id: number;
    @Column({
        type: 'enum',
        enum: DeliveryStatus,
        default: DeliveryStatus.PENDING,
    })
    status: DeliveryStatus;

    @Column()
    cod_amount: number;

    @Column()
    discount_amount: number;

    @Column()
    shipping_amount: number;
    @Column()
    final_amount: number;

    @Column()
    ship_date: Date;

    @CreateDateColumn()
    created: Date;

    @UpdateDateColumn()
    updated: Date;
    
    @OneToOne(() => SubOrder)
    @JoinColumn({ name: 'sub_order' })
    sub_order: SubOrder;
    @Column()
    tracking_number: string;

    @Column()
    delivery_instructions: string;
    
    @Column()
    delivery_method: string; // Hàng nhẹ/ hàng nặng
}