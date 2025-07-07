import { PaymentMethod, PaymentStatus } from "src/common/enums/payment/payment.enum";
import { Order } from "src/orders/entities/order.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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
    @Column({ nullable: true })
    transaction_id: string;
    @Column({ nullable: true })
    paid_at: Date;
    @CreateDateColumn()
    created: Date;
    @UpdateDateColumn()
    updated: Date;
    @Column()
    currency: string;
    @Column({ nullable: true })
    qr_code: string;
    @Column({ nullable: true })
    checkout_url: string; // Link hình ảnh QR code
    @Column({ nullable: true })
    signature: string; // Chữ ký xác thực từ hệ thống thanh toán
   


}