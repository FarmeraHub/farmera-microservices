import {
    FarmStatus as GrpcFarmStatus,
    IdentificationMethod as GrpcIdentificationMethod,
    IdentificationStatus as GrpcIdentificationStatus,
    ProductStatus as GrpcProductStatus,
    PaginationOrder as GrpcPaginationOrder,
    ProcessStage as GrpcProcessStage,
    UpdateProductQuantityOperation as GrpcUpdateProductQuantityOperation,
    AssignmentStatus as GrpcAssignmentStatus,
    DiaryCompletionStatus as GrpcDiaryCompletionStatus
} from "@farmera/grpc-proto/dist/common/enums";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { FarmStatus } from "src/common/enums/farm-status.enum";
import { ProductStatus } from "src/common/enums/product-status.enum";
import { IdentificationMethod, IdentificationStatus } from "src/farms/entities/identification.entity";
import { Order } from "src/pagination/dto/pagination-options.dto";
import { ProcessStage } from "src/common/enums/process-stage.enum";
import { UpdateProductQuantityOperation } from "src/common/enums/update-product-quantity-operation.enum";
import { AssignmentStatus } from "src/common/enums/process-assignment-status";
import { DiaryCompletionStatus } from "src/common/enums/diary-completion-status";
import { status } from "@grpc/grpc-js";
export class EnumsMapper {
    static toGrpcProductStatus(status: ProductStatus): GrpcProductStatus {
        switch (status) {
            case ProductStatus.PRE_ORDER:
                return GrpcProductStatus.PRODUCT_STATUS_PRE_ORDER;
            case ProductStatus.NOT_YET_OPEN:
                return GrpcProductStatus.PRODUCT_STATUS_NOT_YET_OPEN;
            case ProductStatus.OPEN_FOR_SALE:
                return GrpcProductStatus.PRODUCT_STATUS_OPEN_FOR_SALE;
            case ProductStatus.SOLD_OUT:
                return GrpcProductStatus.PRODUCT_STATUS_SOLD_OUT;
            case ProductStatus.CLOSED:
                return GrpcProductStatus.PRODUCT_STATUS_CLOSED;
            case ProductStatus.DELETED:
                return GrpcProductStatus.PRODUCT_STATUS_DELETED;
            default:
                return GrpcProductStatus.PRODUCT_STATUS_UNSPECIFIED;
        }
    }

    static toGrpcFarmStatus(status: FarmStatus): GrpcFarmStatus {
        switch (status) {
            case FarmStatus.PENDING:
                return GrpcFarmStatus.FARM_STATUS_PENDING;
            case FarmStatus.VERIFIED:
                return GrpcFarmStatus.FARM_STATUS_VERIFIED;
            case FarmStatus.APPROVED:
                return GrpcFarmStatus.FARM_STATUS_APPROVED;
            case FarmStatus.BLOCKED:
                return GrpcFarmStatus.FARM_STATUS_BLOCKED;
            case FarmStatus.REJECTED:
                return GrpcFarmStatus.FARM_STATUS_REJECTED;
            default:
                return GrpcFarmStatus.FARM_STATUS_UNSPECIFIED;
        }
    }

    static toGrpcIdentificationMethod(method: IdentificationMethod): GrpcIdentificationMethod {
        switch (method) {
            case IdentificationMethod.BIOMETRIC:
                return GrpcIdentificationMethod.IDENTIFICATION_METHOD_BIOMETRIC;
            case IdentificationMethod.ID_CARD:
                return GrpcIdentificationMethod.IDENTIFICATION_METHOD_ID_CARD;
            default:
                return GrpcIdentificationMethod.IDENTIFICATION_METHOD_UNSPECIFIED;
        }
    }

    static toGrpcIdentificationStatus(status: IdentificationStatus): GrpcIdentificationStatus {
        switch (status) {
            case IdentificationStatus.PENDING:
                return GrpcIdentificationStatus.IDENTIFICATION_STATUS_PENDING;
            case IdentificationStatus.APPROVED:
                return GrpcIdentificationStatus.IDENTIFICATION_STATUS_APPROVED;
            case IdentificationStatus.REJECTED:
                return GrpcIdentificationStatus.IDENTIFICATION_STATUS_REJECTED;
            default:
                return GrpcIdentificationStatus.IDENTIFICATION_STATUS_UNSPECIFIED;
        }
    }

    static fromGrpcPaginationOrder(value?: GrpcPaginationOrder): Order {
        if (!value) throw new InternalServerErrorException("Invalid value");
        switch (value.toString()) {
            case "ASC": return Order.ASC;
            case "DESC": return Order.DESC;
            default: throw new BadRequestException("Invalid pagination value");
        }
    }

    static fromGrpcProductStatus(value: GrpcProductStatus | undefined): ProductStatus | undefined {
        if (!value) return undefined;
        switch (value.toString()) {
            case "PRODUCT_STATUS_PRE_ORDER": return ProductStatus.PRE_ORDER;
            case "PRODUCT_STATUS_NOT_YET_OPEN": return ProductStatus.NOT_YET_OPEN;
            case "PRODUCT_STATUS_OPEN_FOR_SALE": return ProductStatus.OPEN_FOR_SALE;
            case "PRODUCT_STATUS_SOLD_OUT": return ProductStatus.SOLD_OUT;
            case "PRODUCT_STATUS_CLOSED": return ProductStatus.CLOSED;
            case "PRODUCT_STATUS_DELETED": return ProductStatus.DELETED;
            default: return ProductStatus.UNSPECIFIED;
        }
    }

    static toGrpcProcessStage(stage: ProcessStage): GrpcProcessStage {
        switch (stage) {
            case ProcessStage.START: return GrpcProcessStage.PROCESS_STAGE_START;
            case ProcessStage.PRODUCTION: return GrpcProcessStage.PROCESS_STAGE_PRODUCTION;
            case ProcessStage.COMPLETION: return GrpcProcessStage.PROCESS_STAGE_COMPLETION;
            default: return GrpcProcessStage.PROCESS_STAGE_UNSPECIFIED;
        }
    }

    static fromGrpcProcessStage(value: GrpcProcessStage): ProcessStage {
        switch (value.toString()) {
            case "PROCESS_STAGE_START": return ProcessStage.START;
            case "PROCESS_STAGE_PRODUCTION": return ProcessStage.PRODUCTION;
            case "PROCESS_STAGE_COMPLETION": return ProcessStage.COMPLETION;
            default: throw new BadRequestException("Invalid process stage");
        }
    }

    static fromGrpcFarmStatus(valuse: GrpcFarmStatus): FarmStatus {
        switch (valuse.toString()) {
            case "FARM_STATUS_PENDING": return FarmStatus.PENDING;
            case "FARM_STATUS_VERIFIED": return FarmStatus.VERIFIED;
            case "FARM_STATUS_APPROVED": return FarmStatus.APPROVED;
            case "FARM_STATUS_BLOCKED": return FarmStatus.BLOCKED;
            case "FARM_STATUS_REJECTED": return FarmStatus.REJECTED;
            default: return FarmStatus.UNSPECIFIED
        }
    }

    static fromGrpcUpdateProductQuantityOperation(value: GrpcUpdateProductQuantityOperation): UpdateProductQuantityOperation {
        switch (value.toString()) {
            case "INCREASE": return UpdateProductQuantityOperation.INCREASE;
            case "DECREASE": return UpdateProductQuantityOperation.DECREASE;
            default: throw new Error("Invalid update product quantity operation");
        }
    }

    static toGrpcAssignmentStatus(value: AssignmentStatus): GrpcAssignmentStatus {
        switch (value) {
            case AssignmentStatus.ACTIVE: return GrpcAssignmentStatus.ASSIGNMENT_ACTIVE;
            case AssignmentStatus.CANCELLED: return GrpcAssignmentStatus.ASSIGNMENT_CANCELLED;
            case AssignmentStatus.UNACTIVATED: return GrpcAssignmentStatus.ASSIGNMENT_UNACTIVATED;
            default: return GrpcAssignmentStatus.UNRECOGNIZED;
        }
    }

    static fromGrpcAssignmentStatus(value: GrpcAssignmentStatus): AssignmentStatus | undefined {
        switch (value.toString()) {
            case "ASSIGNMENT_UNACTIVATED": return AssignmentStatus.UNACTIVATED;
            case "ASSIGNMENT_ACTIVE": return AssignmentStatus.ACTIVE;
            case "ASSIGNMENT_COMPLETED": return AssignmentStatus.COMPLETED;
            case "ASSIGNMENT_CANCELLED": return AssignmentStatus.CANCELLED;
            default: return undefined;
        }
    }

    static toGrpcDiaryCompletionStatus(status: DiaryCompletionStatus,): GrpcDiaryCompletionStatus {
        switch (status) {
            case DiaryCompletionStatus.IN_PROGRESS:
                return GrpcDiaryCompletionStatus.IN_PROGRESS;
            case DiaryCompletionStatus.COMPLETED:
                return GrpcDiaryCompletionStatus.COMPLETED;
            case DiaryCompletionStatus.SKIPPED:
                return GrpcDiaryCompletionStatus.SKIPPED;
            default:
                return GrpcDiaryCompletionStatus.COMPLETION_STATUS_UNSPECIFIED;
        }
    }

    static fromGrpcDiaryCompletionStatus(value: GrpcDiaryCompletionStatus): DiaryCompletionStatus | undefined {
        switch (value.toString()) {
            case "IN_PROGRESS": return DiaryCompletionStatus.IN_PROGRESS;
            case "COMPLETED": return DiaryCompletionStatus.COMPLETED;
            case "SKIPPED": return DiaryCompletionStatus.SKIPPED;
            default: return undefined;
        }
    }
}