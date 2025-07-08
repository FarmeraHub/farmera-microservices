import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Process } from '../../process/entities/process.entity';
import { DiaryStatus } from '../../common/enums/diary-status.enum';

@Entity('diary')
export class Diary {
  @PrimaryGeneratedColumn('increment')
  diary_id: number;

  @ManyToOne(() => Process, (process) => process.diaryEntries)
  @JoinColumn({ name: 'process_id' })
  process: Process;

  @Column({ type: 'text', nullable: false })
  step_name: string; // e.g., "Chuẩn bị đất trồng"

  @Column({ type: 'text', nullable: false })
  step_description: string; // e.g., "Đào xới đất cho cây"

  @Column({ type: 'text', array: true, nullable: true })
  image_urls: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  video_urls: string[] | null;

  @Column({ type: 'timestamptz', nullable: false })
  recorded_date: Date;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitude: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Additional notes from farmer

  @Column({
    type: 'enum',
    enum: DiaryStatus,
    default: DiaryStatus.IN_PROGRESS,
  })
  status: DiaryStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;
}
