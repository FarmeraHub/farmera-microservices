import {
  Process as GrpcProcess,
  ProcessStep as GrpcProcessStep,
  StepDiaryEntry as GrpcStepDiaryEntry,
  CreateProcessStepInput,
  UpdateProcessStepInput,
} from '@farmera/grpc-proto/dist/products/products';
import { Process } from '../../process/entities/process.entity';
import { ProcessStep } from '../../process/entities/process-step.entity';
import { StepDiaryEntry, } from '../../process/entities/step-diary-entry.entity';
import { TypesMapper } from '../common/types.mapper';
import { CreateProcessStepDto } from 'src/process/dto/create-process-step.dto';
import { UpdateProcessStepDto } from 'src/process/dto/update-process-step.dto';
import { ProductMapper } from './product.mapper';
import { EnumsMapper } from '../common/enums.mapper';

export class ProcessMapper {
  // Process mappers
  static toGrpcProcess(entity: Process): GrpcProcess {
    return {
      process_id: entity.process_id,
      process_name: entity.process_name,
      description: entity.description,
      farm_id: entity.farm?.farm_id || undefined,
      estimated_duration_days: entity.estimated_duration_days,
      is_active: entity.is_active,
      steps: (entity.steps && entity.steps.length > 0)
        ? entity.steps.map((step) => this.toGrpcProcessStep(step))
        : [],
      step_count: entity.step_count ?? undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
      updated: TypesMapper.toGrpcTimestamp(entity.updated),
      product: entity.product ? ProductMapper.toGrpcProduct(entity.product) : undefined,
      assigned_date: TypesMapper.toGrpcTimestamp(entity.assigned_date),
      status: EnumsMapper.toGrpcAssignmentStatus(entity.assignment_status),
      current_step_order: entity.current_step_order,
      completion_percentage: entity.completion_percentage,
      start_date: entity.start_date ? TypesMapper.toGrpcTimestamp(entity.start_date) : undefined,
      target_completion_date: entity.target_completion_date ? TypesMapper.toGrpcTimestamp(entity.target_completion_date) : undefined,
      actual_completion_date: entity.actual_completion_date ? TypesMapper.toGrpcTimestamp(entity.actual_completion_date) : undefined,
    };
  }

  static toGrpcProcessStep(entity: ProcessStep): GrpcProcessStep {
    // console.log(entity);
    return {
      step_id: entity.step_id,
      process_id: entity.process?.process_id || undefined,
      step_order: entity.step_order,
      step_name: entity.step_name,
      step_description: entity.step_description,
      is_required: entity.is_required,
      estimated_duration_days: entity.estimated_duration_days ?? undefined,
      instructions: entity.instructions ?? undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
      diary_entries: (entity.diary_entries && entity.diary_entries.length > 0) ? entity.diary_entries.map((value) => this.toGrpcStepDiaryEntry(value)) : [],
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

  // StepDiaryEntry mappers
  static toGrpcStepDiaryEntry(entity: StepDiaryEntry): GrpcStepDiaryEntry {
    return {
      diary_id: entity.diary_id,
      step_id: entity.step?.step_id,
      step_name: entity.step_name,
      step_order: entity.step_order,
      notes: entity.notes,
      completion_status: EnumsMapper.toGrpcDiaryCompletionStatus(
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
        ? { values: entity.additional_data }
        : undefined,
      created: TypesMapper.toGrpcTimestamp(entity.created),
      updated: TypesMapper.toGrpcTimestamp(entity.updated),
    };
  }
}
