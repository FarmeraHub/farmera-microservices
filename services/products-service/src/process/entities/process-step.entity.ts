import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProcessTemplate } from './process-template.entity';
import { StepDiaryEntry } from '../../diary/entities/step-diary-entry.entity';

@Entity('process_steps')
export class ProcessStep {
  @PrimaryGeneratedColumn('increment')
  step_id: number;

  @ManyToOne(() => ProcessTemplate, (template) => template.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'process_id' })
  processTemplate: ProcessTemplate;

  @Column({ type: 'int', nullable: false })
  step_order: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  step_name: string;

  @Column({ type: 'text', nullable: false })
  step_description: string;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'int', nullable: true })
  estimated_duration_days: number | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @OneToMany(() => StepDiaryEntry, (diary) => diary.step)
  diaryEntries: StepDiaryEntry[];

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;
}
