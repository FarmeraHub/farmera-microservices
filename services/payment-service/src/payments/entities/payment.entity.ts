import { PaymentMethod, PaymentStatus } from "src/common/enums/payment/payment.enum";
import { Order } from "src/orders/entities/order.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('payment')
export class Payment {
    @PrimaryGeneratedColumn('increment')
    payment_id: number;

    @OneToOne(() => Order, (order) => order.payment,)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column()
    amount: number;
    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.COD,
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
    @Column({ nullable: true })
    paid_at: Date;
    @CreateDateColumn()
    created: Date;
    @Column()
    currency: string;
   


}