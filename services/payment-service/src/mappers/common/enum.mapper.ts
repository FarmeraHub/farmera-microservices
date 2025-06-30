import {
    FarmStatus as GrpcFarmStatus,
    MessageType as GrpcMessageType,
    IdentificationStatus as GrpcIdentificationStatus,
    IdentificationMethod as GrpcIdentificationMethod,
    ProductStatus as GrpcProductStatus,
    PaginationOrder,
    ProcessStage as GrpcProcessStage,
    MessageType,
    Gender as GrpcGender,
    UserRole as GrpcUserRole,
    UserStatus as GrpcUserStatus,
    PaymentMethod as GrpcPaymentMethod,
} from "@farmera/grpc-proto/dist/common/enums";
import { FarmStatus } from "src/common/enums/product/farm-status.enum";
import { ProductStatus } from "src/common/enums/product/product-status.enum";
import { Order } from "src/pagination/dto/pagination-options.dto";
import { ProcessStage } from "src/common/enums/product/process-stage.enum";
import { BadRequestException } from "@nestjs/common";
import { IdentificationMethod, IdentificationStatus } from "src/common/enums/product/identification.enum";
import { UserRole } from "src/common/enums/user/roles.enum";
import { UserStatus } from "src/common/enums/user/status.enum";
import { PaymentProvider } from "src/common/enums/user/payment_method.enum";

export class EnumMapper {
    static fromGrpcIdentificationMethod(value: GrpcIdentificationMethod): IdentificationMethod {
        switch (value.toString()) {
            case "IDENTIFICATION_METHOD_BIOMETRIC": return IdentificationMethod.BIOMETRIC;
            case "IDENTIFICATION_METHOD_ID_CARD": return IdentificationMethod.ID_CARD;
            case "IDENTIFICATION_METHOD_PASSPORT": return IdentificationMethod.PASSPORT;
            default: return IdentificationMethod.UNSPECIFIED;
        }
    }

    static fromGrpcIdentificationStatus(value: GrpcIdentificationStatus): IdentificationStatus {
        switch (value.toString()) {
            case "IDENTIFICATION_STATUS_PENDING": return IdentificationStatus.PENDING;
            case "IDENTIFICATION_STATUS_APPROVED": return IdentificationStatus.APPROVED;
            case "IDENTIFICATION_STATUS_REJECTED": return IdentificationStatus.REJECTED;
            default: return IdentificationStatus.UNSPECIFIED;

        }
    }

    static fromGrpcMessageType(value: GrpcMessageType | undefined): MessageType | undefined {
        if (!value) return undefined;
        switch (value.toString()) {
            case "MEDIA": return MessageType.MEDIA;
            case "MESSAGE": return MessageType.MESSAGE;
            default: return MessageType.MESSAGE_TYPE_UNSPECIFIED;
        }
    }

    static fromGrpcFarmStatus(value: GrpcFarmStatus): FarmStatus {
        switch (value.toString()) {
            case "FARM_STATUS_PENDING": return FarmStatus.PENDING;
            case "FARM_STATUS_VERIFIED": return FarmStatus.VERIFIED;
            case "FARM_STATUS_APPROVED": return FarmStatus.APPROVED;
            case "FARM_STATUS_BLOCKED": return FarmStatus.BLOCKED;
            case "FARM_STATUS_REJECTED": return FarmStatus.REJECTED;
            default: return FarmStatus.UNSPECIFIED;
        }
    }

    static fromGrpcProductStatus(value: GrpcProductStatus): ProductStatus {
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

    static toGrpcSortOrder(value: Order): PaginationOrder | undefined {
        if (!value) return undefined;
        switch (value) {
            case Order.ASC: return PaginationOrder.ASC;
            case Order.DESC: return PaginationOrder.DESC;
            default: return PaginationOrder.ORDER_UNSPECIFIED;
        }
    }

    static toGrpcProductStatus(status: ProductStatus): GrpcProductStatus | undefined {
        if (!status) return undefined;
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

    static toGrpcProcessStage(stage: ProcessStage): GrpcProcessStage | undefined {
        if (!stage) return undefined;
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
    static fromGrpcGender(value: GrpcGender): string {
        switch (value.toString()) {
            case "GENDER_UNSPECIFIED": return "Unspecified";
            case "GENDER_MALE": return "Male";
            case "GENDER_FEMALE": return "Female";
            case "GENDER_OTHER": return "Other";
            case "GENDER_PREFER_NOT_TO_SAY": return "Prefer not to say";
            default: throw new BadRequestException("Invalid Gender value");
        }
    }
    static fromGrpcUserRole(value: GrpcUserRole): UserRole {
        switch (value.toString()) {
            case "USER_ROLE_ADMIN": return UserRole.ADMIN;
            case "USER_ROLE_FARMER": return UserRole.FARMER;
            case "USER_ROLE_CUSTOMER": return UserRole.BUYER;
            default: throw new BadRequestException("Invalid User Role value");
        }
        
    }
    static fromGrpcUserStatus(value: GrpcUserStatus): UserStatus {
        switch (value.toString()) {
            case "USER_STATUS_ACTIVE": return UserStatus.ACTIVE;
            case "USER_STATUS_INACTIVE": return UserStatus.INACTIVE;
            case "USER_STATUS_BANNED": return UserStatus.BANNED;
            default: throw new BadRequestException("Invalid User Status value");
        }
    }
    static fromGrpcPaymentProvider(value: GrpcPaymentMethod ) :PaymentProvider {
        switch (value.toString()) {
            case "PAYMENT_METHOD_PAYPAL": return PaymentProvider.PAYPAL;
            case "PAYMENT_METHOD_STRIPE": return PaymentProvider.STRIPE;
            case "PAYMENT_METHOD_BANK_TRANSFER": return PaymentProvider.BANK_TRANSFER;
            case "PAYMENT_METHOD_CREDIT_CARD": return PaymentProvider.CREDIT_CARD;
            case "PAYMENT_METHOD_OTHER": return PaymentProvider.OTHER;
            default: throw new BadRequestException("Invalid Payment Method value");
        }
    }
}