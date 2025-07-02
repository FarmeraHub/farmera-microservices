import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProcessTemplate } from './process-template.entity';

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('product_process_assignments')
export class ProductProcessAssignment {
  @PrimaryGeneratedColumn('increment')
  assignment_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProcessTemplate, (template) => template.productAssignments)
  @JoinColumn({ name: 'process_id' })
  processTemplate: ProcessTemplate;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  assigned_date: Date;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Column({ type: 'int', nullable: true })
  current_step_order: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.0 })
  completion_percentage: number;

  @Column({ type: 'timestamptz', nullable: true })
  start_date: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  target_completion_date: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  actual_completion_date: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated: Date;
}
