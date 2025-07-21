import { AssignmentStatus } from "src/common/enums/process-assignment-status";

export class ProcessLite {
    process_id: number;
    process_name: string;
    description: string;
    estimated_duration_days: number;
    is_active: boolean;
    step_count?: number;
    created: Date;
    updated: Date;
    assigned_date: Date;
    status: AssignmentStatus;
    current_step_order?: number;
    completion_percentage: number;
    start_date?: Date;
    target_completion_date?: Date;
    actual_completion_date?: Date;
}
