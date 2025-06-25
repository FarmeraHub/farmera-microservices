import { FarmStatus as GrpcFarmStatus, MessageType as GrpcMessageType, IdentificationStatus as GrpcIdentificationStatus, IdentificationMethod as GrpcIdentificationMethod, ProductStatus as GrpcProductStatus, PaginationOrder, ProcessStage as GrpcProcessStage, Gender as GrpcGender, UserRole as GrpcUserRole, UserStatus as GrpcUserStatus, PaymentProvider as GrpcPaymentProvider } from "@farmera/grpc-proto/dist/common/enums";
import { MessageType } from "src/communication/enums/message-type.enums";
import { FarmStatus } from "src/common/enums/product/farm-status.enum";
import { ProductStatus } from "src/common/enums/product/product-status.enum";
import { IdentificationMethod, IdentificationStatus } from "src/product/farm/entities/identification.entity";
import { Order } from "src/pagination/dto/pagination-options.dto";
import { ProcessStage } from "src/common/enums/product/process-stage.enum";
import { BadRequestException } from "@nestjs/common";
import { Gender } from "src/common/enums/user/gender.enum";
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

    static toGrpcGender(value: Gender): GrpcGender {
        switch (value) {
            case Gender.MALE: return GrpcGender.GENDER_MALE;
            case Gender.FEMALE: return GrpcGender.GENDER_FEMALE;
            default: return GrpcGender.GENDER_UNSPECIFIED;
        }
    }

    static fromGrpcGender(value: GrpcGender): Gender {
        switch (value.toString()) {
            case "GENDER_MALE": return Gender.MALE;
            case "GENDER_FEMALE": return Gender.FEMALE;
            default: return Gender.UNSPECIFIED;
        }
    }

    static fromGrpcUserRole(value: GrpcUserRole): UserRole {
        switch (value.toString()) {
            case "USER_ROLE_BUYER": return UserRole.BUYER;
            case "USER_ROLE_FARMER": return UserRole.FARMER;
            case "USER_ROLE_ADMIN": return UserRole.ADMIN;
            default: throw new BadRequestException("Invalid user role");
        }
    }

    static fromGrpcUserStatus(grpcStatus: GrpcUserStatus): UserStatus {
        switch (grpcStatus.toString()) {
            case "USER_STATUS_ACTIVE":
                return UserStatus.ACTIVE;
            case "USER_STATUS_INACTIVE":
                return UserStatus.INACTIVE;
            case "USER_STATUS_BANNED":
                return UserStatus.BANNED;
            case "USER_STATUS_PENDING_VERIFICATION":
                return UserStatus.PENDING_VERIFICATION;
            case "USER_STATUS_SUSPENDED":
                return UserStatus.SUSPENDED;
            default:
                throw new Error(`Unsupported gRPC user status: ${grpcStatus}`);
        }
    }

    static toGrpcPaymentProvider(value: PaymentProvider): GrpcPaymentProvider {
        switch (value) {
            case PaymentProvider.VNPAY: return GrpcPaymentProvider.PAYMENT_PROVIDER_VNPAY;
            case PaymentProvider.MOMO: return GrpcPaymentProvider.PAYMENT_PROVIDER_MOMO;
            case PaymentProvider.ZALOPAY: return GrpcPaymentProvider.PAYMENT_PROVIDER_ZALOPAY;
            case PaymentProvider.OTHER: return GrpcPaymentProvider.PAYMENT_PROVIDER_OTHER;
            default: return GrpcPaymentProvider.PAYMENT_PROVIDER_UNSPECIFIED;
        }
    }

    static fromGrpcPaymentProvider(value: GrpcPaymentProvider): PaymentProvider {
        switch (value.toString()) {
            case "PAYMENT_PROVIDER_VNPAY": return PaymentProvider.VNPAY;
            case "PAYMENT_PROVIDER_MOMO": return PaymentProvider.MOMO;
            case "PAYMENT_PROVIDER_ZALOPAY": return PaymentProvider.ZALOPAY;
            case "PAYMENT_PROVIDER_OTHER": return PaymentProvider.OTHER;
            default: throw new BadRequestException("Invalid payment provider");
        }
    }
}