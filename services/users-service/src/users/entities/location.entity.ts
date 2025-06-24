import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'locations' })
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string; // Name associated with this address (e.g., recipient name)

  @Column({ nullable: true })
  phone: string; // Phone number for this address

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
  user: User;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  created_at: Date;

  @Column({ nullable: true })
  updated_at: Date;
}
