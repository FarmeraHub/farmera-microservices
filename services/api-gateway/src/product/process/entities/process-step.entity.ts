
import { StepDiaryEntry } from './step-diary-entry.entity';

export class ProcessStep {
  step_id: number;
  process_id?: number;
  step_order: number;
  step_name: string;
  step_description: string;
  is_required: boolean;
  estimated_duration_days: number;
  instructions: string | null;
  diary_entries: StepDiaryEntry[];
  created: Date;
}
