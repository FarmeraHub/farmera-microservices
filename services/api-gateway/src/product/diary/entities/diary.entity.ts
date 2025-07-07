import { DiaryStatus } from '../dto/create-diary.dto';

export class Diary {
  diary_id: number;
  process_id: number;
  step_name: string;
  step_description: string;
  image_urls: string[] | null;
  video_urls: string[] | null;
  recorded_date: Date;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  status: DiaryStatus;
  created: Date;
}
