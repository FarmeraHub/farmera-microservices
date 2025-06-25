import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'locations' })
export class Location {
  @PrimaryGeneratedColumn()
  location_id: number;

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

  @ManyToOne(() => User, (user) => user.locations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
