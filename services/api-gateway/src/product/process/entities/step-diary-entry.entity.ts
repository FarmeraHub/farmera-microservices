
import { DiaryCompletionStatus } from 'src/common/enums/product/diary-completion-status';

export class StepDiaryEntry {
  diary_id: number;
  step_id?: number;
  step_name: string;
  step_order: number;
  notes: string;
  completion_status: DiaryCompletionStatus;
  image_urls: string[];
  video_urls: string[];
  recorded_date: Date;
  latitude: number;
  longitude: number;
  weather_conditions: string;
  quality_rating: number; // 1-5 stars
  issues_encountered: string | null;
  additional_data: Record<string, any> | null;
  created: Date;
  updated: Date;
}
