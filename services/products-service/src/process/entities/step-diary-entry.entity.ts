import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProcessStep } from './process-step.entity';
import { DiaryCompletionStatus } from 'src/common/enums/diary-completion-status';

@Entity('step_diary_entries')
export class StepDiaryEntry {
  @PrimaryGeneratedColumn('increment')
  diary_id: number;

  @ManyToOne(() => ProcessStep)
  @JoinColumn({ name: 'step_id' })
  step: ProcessStep;

  @Column({ type: 'varchar', length: 255, nullable: false })
  step_name: string;

  @Column({ type: 'int', nullable: false })
  step_order: number;

  @Column({ type: 'text', nullable: false })
  notes: string;

  @Column({
    type: 'enum',
    enum: DiaryCompletionStatus,
    default: DiaryCompletionStatus.IN_PROGRESS,
  })
  completion_status: DiaryCompletionStatus;

  @Column({ type: 'text', array: true, default: [] })
  image_urls: string[];

  @Column({ type: 'text', array: true, default: [] })
  video_urls: string[];

  @Column({ type: 'timestamptz', nullable: false })
  recorded_date: Date;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: false })
  latitude: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: false })
  longitude: number;

  @Column({ type: 'text', nullable: false })
  weather_conditions: string;

  @Column({ type: 'int', nullable: false })
  quality_rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  issues_encountered: string | null;

  @Column({ type: 'jsonb', nullable: true })
  additional_data: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated: Date;
}
