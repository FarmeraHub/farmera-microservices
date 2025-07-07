import {
  ProcessTemplate as GrpcProcessTemplate,
  ProcessStep as GrpcProcessStep,
  ProductProcessAssignment as GrpcProductProcessAssignment,
  StepDiaryEntry as GrpcStepDiaryEntry,
  CreateProcessStepInput,
  UpdateProcessStepInput,
  AssignmentStatus as GrpcAssignmentStatus,
  DiaryCompletionStatus as GrpcDiaryCompletionStatus,
} from '@farmera/grpc-proto/dist/products/products';
import { ProcessTemplate } from '../../../../process/entities/process-template.entity';
import { ProcessStep } from '../../../../process/entities/process-step.entity';
import {
  ProductProcessAssignment,
  AssignmentStatus,
} from '../../../../process/entities/product-process-assignment.entity';
import {
  StepDiaryEntry,
  DiaryCompletionStatus,
} from '../../../../diary/entities/step-diary-entry.entity';
import { CreateProcessStepDto } from '../../../../process/dto/create-process-template.dto';
import { UpdateProcessStepDto } from '../../../../process/dto/update-process-template.dto';
import { TypesMapper } from '../common/types.mapper';

export class ProcessTemplateMapper {
  // ProcessTemplate mappers
  static toGrpcProcessTemplate(entity: ProcessTemplate): GrpcProcessTemplate {
    return {
      process_id: entity.process_id,
      process_name: entity.process_name,
      description: entity.description,
      farm_id: entity.farm_id || entity.farm?.farm_id || '',
      estimated_duration_days: entity.estimated_duration_days ?? undefined,
      is_active: entity.is_active,
      steps: entity.steps
        ? entity.steps.map((step) => this.toGrpcProcessStep(step))
        : [],
      step_count: entity.step_count ?? undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
      updated: TypesMapper.toGrpcTimestamp(entity.updated),
    };
  }

  static toGrpcProcessStep(entity: ProcessStep): GrpcProcessStep {
    return {
      step_id: entity.step_id,
      process_id: entity.processTemplate?.process_id || 0,
      step_order: entity.step_order,
      step_name: entity.step_name,
      step_description: entity.step_description,
      is_required: entity.is_required,
      estimated_duration_days: entity.estimated_duration_days ?? undefined,
      instructions: entity.instructions ?? undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
    };
  }

  static fromGrpcCreateProcessStepInput(
    input: CreateProcessStepInput,
  ): CreateProcessStepDto {
    return {
      step_order: input.step_order,
      step_name: input.step_name,
      step_description: input.step_description,
      is_required: input.is_required,
      estimated_duration_days: input.estimated_duration_days,
      instructions: input.instructions,
    };
  }

  static fromGrpcUpdateProcessStepInput(
    input: UpdateProcessStepInput,
  ): UpdateProcessStepDto {
    return {
      step_id: input.step_id,
      step_order: input.step_order,
      step_name: input.step_name,
      step_description: input.step_description,
      is_required: input.is_required,
      estimated_duration_days: input.estimated_duration_days,
      instructions: input.instructions,
    };
  }

  // ProductProcessAssignment mappers
  static toGrpcProductProcessAssignment(
    entity: ProductProcessAssignment,
  ): GrpcProductProcessAssignment {
    return {
      assignment_id: entity.assignment_id,
      product_id: entity.product?.product_id || 0,
      process_id: entity.processTemplate?.process_id || 0,
      assigned_date: TypesMapper.toGrpcTimestamp(entity.assigned_date),
      status: this.toGrpcAssignmentStatus(entity.status),
      current_step_order: entity.current_step_order ?? undefined,
      completion_percentage: entity.completion_percentage,
      start_date: entity.start_date
        ? TypesMapper.toGrpcTimestamp(entity.start_date)
        : undefined,
      target_completion_date: entity.target_completion_date
        ? TypesMapper.toGrpcTimestamp(entity.target_completion_date)
        : undefined,
      actual_completion_date: entity.actual_completion_date
        ? TypesMapper.toGrpcTimestamp(entity.actual_completion_date)
        : undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
      updated: TypesMapper.toGrpcTimestamp(entity.updated),
      process_template: entity.processTemplate
        ? this.toGrpcProcessTemplate(entity.processTemplate)
        : undefined,
    };
  }

  static toGrpcAssignmentStatus(
    status: AssignmentStatus,
  ): GrpcAssignmentStatus {
    switch (status) {
      case AssignmentStatus.ACTIVE:
        return GrpcAssignmentStatus.ASSIGNMENT_ACTIVE;
      case AssignmentStatus.COMPLETED:
        return GrpcAssignmentStatus.ASSIGNMENT_COMPLETED;
      case AssignmentStatus.CANCELLED:
        return GrpcAssignmentStatus.ASSIGNMENT_CANCELLED;
      default:
        return GrpcAssignmentStatus.ASSIGNMENT_ACTIVE;
    }
  }

  static fromGrpcAssignmentStatus(
    status: GrpcAssignmentStatus,
  ): AssignmentStatus {
    switch (status) {
      case GrpcAssignmentStatus.ASSIGNMENT_ACTIVE:
        return AssignmentStatus.ACTIVE;
      case GrpcAssignmentStatus.ASSIGNMENT_COMPLETED:
        return AssignmentStatus.COMPLETED;
      case GrpcAssignmentStatus.ASSIGNMENT_CANCELLED:
        return AssignmentStatus.CANCELLED;
      default:
        return AssignmentStatus.ACTIVE;
    }
  }

  // StepDiaryEntry mappers
  static toGrpcStepDiaryEntry(entity: StepDiaryEntry): GrpcStepDiaryEntry {
    return {
      diary_id: entity.diary_id,
      assignment_id: entity.assignment?.assignment_id || 0,
      step_id: entity.step?.step_id || 0,
      product_id: entity.product_id,
      step_name: entity.step_name,
      step_order: entity.step_order,
      notes: entity.notes,
      completion_status: this.toGrpcDiaryCompletionStatus(
        entity.completion_status,
      ),
      image_urls: entity.image_urls || [],
      video_urls: entity.video_urls || [],
      recorded_date: TypesMapper.toGrpcTimestamp(entity.recorded_date),
      latitude: entity.latitude ?? undefined,
      longitude: entity.longitude ?? undefined,
      weather_conditions: entity.weather_conditions ?? undefined,
      quality_rating: entity.quality_rating ?? undefined,
      issues_encountered: entity.issues_encountered ?? undefined,
      additional_data: entity.additional_data
        ? JSON.stringify(entity.additional_data)
        : undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
      updated: TypesMapper.toGrpcTimestamp(entity.updated),
      step: entity.step ? this.toGrpcProcessStep(entity.step) : undefined,
      assignment: entity.assignment
        ? this.toGrpcProductProcessAssignment(entity.assignment)
        : undefined,
    };
  }

  static toGrpcDiaryCompletionStatus(
    status: DiaryCompletionStatus,
  ): GrpcDiaryCompletionStatus {
    switch (status) {
      case DiaryCompletionStatus.IN_PROGRESS:
        return GrpcDiaryCompletionStatus.IN_PROGRESS;
      case DiaryCompletionStatus.COMPLETED:
        return GrpcDiaryCompletionStatus.COMPLETED;
      case DiaryCompletionStatus.SKIPPED:
        return GrpcDiaryCompletionStatus.SKIPPED;
      default:
        return GrpcDiaryCompletionStatus.IN_PROGRESS;
    }
  }

  static fromGrpcDiaryCompletionStatus(
    status: GrpcDiaryCompletionStatus | string,
  ): DiaryCompletionStatus {
    if (typeof status === 'string') {
      switch (status) {
        case 'IN_PROGRESS':
          return DiaryCompletionStatus.IN_PROGRESS;
        case 'COMPLETED':
          return DiaryCompletionStatus.COMPLETED;
        case 'SKIPPED':
          return DiaryCompletionStatus.SKIPPED;
        default:
          return DiaryCompletionStatus.IN_PROGRESS;
      }
    }
    switch (status) {
      case GrpcDiaryCompletionStatus.IN_PROGRESS:
        return DiaryCompletionStatus.IN_PROGRESS;
      case GrpcDiaryCompletionStatus.COMPLETED:
        return DiaryCompletionStatus.COMPLETED;
      case GrpcDiaryCompletionStatus.SKIPPED:
        return DiaryCompletionStatus.SKIPPED;
      default:
        return DiaryCompletionStatus.IN_PROGRESS;
    }
  }
}
