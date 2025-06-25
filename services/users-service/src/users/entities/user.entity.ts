import { UserRole } from 'src/enums/roles.enum';
import { UserStatus } from 'src/enums/status.enum';
import { Column, Entity, OneToMany, PrimaryColumn, BeforeInsert, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Location } from './location.entity';
import { PaymentMethod } from './payment_method.entity';
import { Exclude } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { Gender } from 'src/enums/gender.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

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
  farm_id?: string;

  @Column({ nullable: true, enum: Gender })
  gender: Gender;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  birthday?: Date;

  @Column({ nullable: false, enum: UserRole })
  role: UserRole;

  @Column({ nullable: false, default: 0 })
  points: number;

  @Column({ nullable: false, enum: UserStatus })
  status: UserStatus;

  @OneToMany(() => Location, (location) => location.user, { cascade: true })
  @JoinColumn({ name: 'location_id' })
  locations: Location[];

  @OneToMany(() => PaymentMethod, (paymentMethod) => paymentMethod.user, {
    cascade: true,
  })
  @JoinColumn({ name: 'payment_method_id' })
  payment_methods: PaymentMethod[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
