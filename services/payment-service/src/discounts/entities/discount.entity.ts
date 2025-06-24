import { DiscountStatus, DiscountType } from "src/common/enums/payment/discount.enum";
import { DiscountUsage } from "src/discounts/entities/discount-usage.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('discount')
export class Discount {
    @PrimaryGeneratedColumn('increment')
    discount_id: number;
    @Column()
    discount_name: string;
    @Column({
        type: 'enum',
        enum: DiscountType,
        default: DiscountType.PERCENTAGE,
    })
    discount_type: DiscountType;
    @Column()
    discount_value: number;
    @Column()
    quantity: number;
    @Column()
    min_order: number;
    @Column()
    max_discount: number;
    @Column()
    decription: string;
    @Column({
        type: 'enum',
        enum: DiscountStatus,
        default: DiscountStatus.ACTIVE,
    })
    status: DiscountStatus;
    @Column()
    start_date: Date;
    @Column()
    end_date: Date;
    @CreateDateColumn()
    created: Date;
    @OneToMany(() => DiscountUsage, (discountUsage) => discountUsage.discount_id, { cascade: true })
    discount_usage: DiscountUsage[];

}