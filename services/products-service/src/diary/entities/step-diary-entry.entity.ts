import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductProcessAssignment } from '../../process/entities/product-process-assignment.entity';
import { ProcessStep } from '../../process/entities/process-step.entity';

export enum DiaryCompletionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

@Entity('step_diary_entries')
export class StepDiaryEntry {
  @PrimaryGeneratedColumn('increment')
  diary_id: number;

  @ManyToOne(() => ProductProcessAssignment)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ProductProcessAssignment;

  @ManyToOne(() => ProcessStep)
  @JoinColumn({ name: 'step_id' })
  step: ProcessStep;

  @Column({ type: 'int', nullable: false })
  product_id: number;

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

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  weather_conditions: string | null;

  @Column({ type: 'int', nullable: true })
  quality_rating: number | null; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  issues_encountered: string | null;

  @Column({ type: 'jsonb', nullable: true })
  additional_data: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated: Date;
}
