import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { PaymentProvider } from 'src/enums/payment_method.enum';

@Entity({ name: 'payment_methods' })
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.OTHER,
  })
  provider: PaymentProvider;

  @Column({ nullable: false })
  external_id: string;

  @Column({ nullable: true })
  last_four: string;

  @Column({ nullable: true })
  card_type: string;

  @Column({ nullable: true })
  expiry_date: string;

  @Column({ nullable: true })
  cardholder_name: string;

  @Column({ nullable: true })
  billing_address: string;

  @Column({ nullable: true })
  token: string;

  @Column({ default: false })
  is_default: boolean;

  @ManyToOne(() => User, (user) => user.payment_methods)
  user: User;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  metadata: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  created_at: Date;

  @Column({ nullable: true })
  updated_at: Date;
}
