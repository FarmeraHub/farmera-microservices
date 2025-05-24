import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'verifications' })
export class Verification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: false })
  email_code: string;

  @Column({ nullable: true })
  phone_code: string;

  @Column({ nullable: false })
  email_code_count: number;

  @Column({ nullable: true })
  phone_code_count: number;

  @Column({ nullable: false })
  created_at: Date;

  @Column({ nullable: false })
  updated_at: Date;
}
