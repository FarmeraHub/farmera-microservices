import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Process } from './process.entity';
import { StepDiaryEntry } from './step-diary-entry.entity';

@Entity('process_steps')
export class ProcessStep {
  @PrimaryGeneratedColumn('increment')
  step_id: number;

  @ManyToOne(() => Process, (process) => process.steps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'process_id' })
  process: Process;

  @Column({ type: 'int', nullable: false })
  step_order: number;

  @Column({ type: 'text', nullable: false })
  step_name: string;

  @Column({ type: 'text', nullable: false })
  step_description: string;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'int', nullable: false })
  estimated_duration_days: number;

  @Column({ type: 'text', nullable: false })
  instructions: string | null;

  @OneToMany(() => StepDiaryEntry, (diary) => diary.step)
  diary_entries: StepDiaryEntry[];

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;
}
