import { Process as GrpcProcess, ProcessStep as GrpcProcessStep, StepDiaryEntry as GrpcStepDiaryEntry, ProcessLite as GrpcProcessLite } from "@farmera/grpc-proto/dist/products/products";
import { Process } from "src/product/process/entities/process.entity";
import { ProcessStep } from "src/product/process/entities/process-step.entity";
import { StepDiaryEntry } from "src/product/process/entities/step-diary-entry.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
import { ProductMapper } from "./product.mapper";
import { ProcessLite } from "src/product/process/dto/process-lite.dto";

export class ProcessMapper {

    static fromGrpcStepDiary(value: GrpcStepDiaryEntry): StepDiaryEntry | undefined {
        if (!value) return undefined;
        return {
            diary_id: value.diary_id,
            step_id: value.step_id,
            step_name: value.step_name,
            step_order: value.step_order,
            notes: value.notes,
            completion_status: EnumMapper.fromGrpcDiaryCompletionStatus(value.completion_status),
            image_urls: value.image_urls,
            video_urls: value.video_urls,
            recorded_date: TypesMapper.fromGrpcTimestamp(value.recorded_date),
            latitude: value.latitude,
            longitude: value.longitude,
            weather_conditions: value.weather_conditions,
            quality_rating: value.quality_rating,
            issues_encountered: value.issues_encountered,
            additional_data: value.additional_data.values,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
        }
    }

    static fromGrpcProcessStep(value: GrpcProcessStep): ProcessStep | undefined {
        if (!value) return undefined;
        return {
            step_id: value.step_id,
            process_id: value.process_id,
            step_order: value.step_order,
            step_name: value.step_name,
            step_description: value.step_description,
            is_required: value.is_required,
            estimated_duration_days: value.estimated_duration_days,
            instructions: value.instructions,
            diary_entries: value.diary_entries.map((value) => this.fromGrpcStepDiary(value)),
            created: TypesMapper.fromGrpcTimestamp(value.created),
        }
    }

    static fromGrpcProcess(value: GrpcProcess): Process | undefined {
        if (!value) return undefined;
        return {
            process_id: value.process_id,
            process_name: value.process_name,
            description: value.description,
            farm_id: value.farm_id,
            estimated_duration_days: value.estimated_duration_days,
            is_active: value.is_active,
            steps: value.steps.map((step) => this.fromGrpcProcessStep(step)),
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
            product: value.product ? ProductMapper.fromGrpcProduct(value.product) : undefined,
            assigned_date: TypesMapper.fromGrpcTimestamp(value.assigned_date),
            assignment_status: EnumMapper.fromGrpcAssignmentStatus(value.status),
            current_step_order: value.current_step_order,
            completion_percentage: value.completion_percentage,
            start_date: TypesMapper.fromGrpcTimestamp(value.start_date),
            target_completion_date: TypesMapper.fromGrpcTimestamp(value.target_completion_date),
            actual_completion_date: TypesMapper.fromGrpcTimestamp(value.actual_completion_date),
            step_count: value.step_count ?? 0,
        }
    }

    static fromGrpcProcessLite(value: GrpcProcessLite): ProcessLite | undefined {
        if (!value) return undefined;

        return {
            process_id: value.process_id,
            process_name: value.process_name,
            description: value.description,
            estimated_duration_days: value.estimated_duration_days,
            is_active: value.is_active,
            step_count: value.step_count ?? 0,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
            assigned_date: TypesMapper.fromGrpcTimestamp(value.assigned_date),
            status: EnumMapper.fromGrpcAssignmentStatus(value.status),
            current_step_order: value.current_step_order,
            completion_percentage: value.completion_percentage,
            start_date: TypesMapper.fromGrpcTimestamp(value.start_date),
            target_completion_date: TypesMapper.fromGrpcTimestamp(value.target_completion_date),
            actual_completion_date: TypesMapper.fromGrpcTimestamp(value.actual_completion_date),
        };
    }

}