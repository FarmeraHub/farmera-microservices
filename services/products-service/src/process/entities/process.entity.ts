import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ProcessStep } from './process-step.entity';
import { Farm } from 'src/farms/entities/farm.entity';
import { Product } from 'src/products/entities/product.entity';
import { AssignmentStatus } from 'src/common/enums/process-assignment-status';

@Entity('process')
export class Process {
  @PrimaryGeneratedColumn('increment')
  process_id: number;

  @Column({ type: 'text', nullable: false })
  process_name: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @ManyToOne(() => Farm)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ type: 'int', nullable: false })
  estimated_duration_days: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => ProcessStep, (step) => step.process, {
    cascade: true,
    eager: false,
  })
  steps: ProcessStep[];

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated: Date;

  // Virtual field for step count
  step_count?: number;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @Column({ type: 'timestamptz', nullable: true })
  assigned_date: Date;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.UNACTIVATED,
  })
  assignment_status: AssignmentStatus;

  @Column({ type: 'int', nullable: true })
  current_step_order: number | undefined;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  completion_percentage: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_date: Date | undefined;

  @Column({ type: 'timestamptz', nullable: true })
  target_completion_date: Date | undefined;

  @Column({ type: 'timestamptz', nullable: true })
  actual_completion_date: Date | undefined;
}