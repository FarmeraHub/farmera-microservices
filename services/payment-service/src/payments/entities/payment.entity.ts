import { PaymentMethod, PaymentStatus } from "src/common/enums/payment.enum";
import { Order } from "src/orders/entities/order.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,  OneToOne,  PrimaryGeneratedColumn } from "typeorm";

@Entity('payment')
export class Payment {
    @PrimaryGeneratedColumn('increment')
    payment_id: number;

    @OneToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order_id: Order;

    @Column()
    amount: number;
    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CREDIT_CARD,
    })
    method: PaymentMethod;
    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus; 
    @Column()
    transaction_id: string;
    @Column()
    paid_at: Date;
    @CreateDateColumn()
    created: Date;


}