import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'locations' })
export class Location {
  @PrimaryGeneratedColumn()
  location_id: number;

  @Column({ nullable: true })
  name: string; // Name associated with this address (e.g., recipient name)

  @Column({ nullable: true })
  phone: string; // Phone number for this address

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  phone: string

  @Column({ nullable: false })
  city: string;

  @Column({ nullable: false })
  district: string;

  @Column({ nullable: true })
  ward: string;

  @Column({ nullable: false })
  street: string;

  @Column({ nullable: true })
  address_line: string;

  @Column({ nullable: true })
  type: string; // e.g., 'home', 'work', 'shipping', etc.

  @Column({ default: false })
  is_primary: boolean;

  @Column({ nullable: true })
  latitude: number;

  @Column({ nullable: true })
  longitude: number;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postal_code: string;

  @Column({ nullable: true })
  state: string;

  @ManyToOne(() => User, (user) => user.locations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
