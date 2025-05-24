import { UserRole } from 'src/enums/roles.enum';
import { UserStatus } from 'src/enums/status.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Location } from './location.entity';
import { PaymentMethod } from './payment_method.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  hashed_pwd: string;

  @Column({ nullable: true })
  farm_id: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  birthday: Date;

  @Column({ nullable: false, enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  points: number;

  @Column({ nullable: true, enum: UserStatus })
  status: UserStatus;

  @OneToMany(() => Location, (location) => location.user, { cascade: true })
  locations: Location[];

  @OneToMany(() => PaymentMethod, (paymentMethod) => paymentMethod.user, {
    cascade: true,
  })
  payment_methods: PaymentMethod[];

  @Column({ nullable: true })
  created_at: Date;

  @Column({ nullable: true })
  updated_at: Date;
}
