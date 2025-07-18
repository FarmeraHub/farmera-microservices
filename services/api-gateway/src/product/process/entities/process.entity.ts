
import { ProcessStep } from './process-step.entity';
import { Product } from 'src/product/product/entities/product.entity';
import { AssignmentStatus } from 'src/common/enums/product/process-assignment-status';

export class Process {
  process_id: number;
  process_name: string;
  description: string;
  farm_id: string;
  estimated_duration_days: number;
  is_active: boolean;
  steps: ProcessStep[];
  created: Date;
  updated: Date;
  product?: Product;
  assigned_date: Date;
  assignment_status: AssignmentStatus;
  current_step_order: number | undefined;
  completion_percentage: number;
  start_date: Date | undefined;
  target_completion_date: Date | undefined;
  actual_completion_date: Date | undefined;
}