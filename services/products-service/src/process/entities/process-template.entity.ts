import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';
import { ProcessStep } from './process-step.entity';
import { ProductProcessAssignment } from './product-process-assignment.entity';

@Entity('process_templates')
export class ProcessTemplate {
  @PrimaryGeneratedColumn('increment')
  process_id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  process_name: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'uuid', nullable: false })
  farm_id: string;

  @ManyToOne(() => Farm)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ type: 'int', nullable: true })
  estimated_duration_days: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => ProcessStep, (step) => step.processTemplate, {
    cascade: true,
    eager: false,
  })
  steps: ProcessStep[];

  @OneToMany(
    () => ProductProcessAssignment,
    (assignment) => assignment.processTemplate,
  )
  productAssignments: ProductProcessAssignment[];

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated: Date;

  // Virtual field for step count
  step_count?: number;
}
