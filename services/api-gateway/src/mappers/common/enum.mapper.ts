import { FarmStatus as GrpcFarmStatus, MessageType as GrpcMessageType, IdentificationStatus as GrpcIdentificationStatus, IdentificationMethod as GrpcIdentificationMethod, ProductStatus as GrpcProductStatus, PaginationOrder, ProcessStage as GrpcProcessStage, NotificationChannel as GrpcNotificationChannel, NotificationType as GrpcNotificationType } from "@farmera/grpc-proto/dist/common/enums";
import { MessageType } from "src/communication/enums/message-type.enums";
import { FarmStatus } from "src/common/enums/product/farm-status.enum";
import { ProductStatus } from "src/common/enums/product/product-status.enum";
import { IdentificationMethod, IdentificationStatus } from "src/product/farm/entities/identification.entity";
import { Order } from "src/pagination/dto/pagination-options.dto";
import { ProcessStage } from "src/common/enums/product/process-stage.enum";
import { BadRequestException } from "@nestjs/common";
import { NotificationChannel } from "src/common/enums/notification/notification-channel.enum";
import { NotificationType } from "src/common/enums/notification/notification_type";

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

    static toGrpcNotificationChannel(value: NotificationChannel): GrpcNotificationChannel {
        if (!value) return undefined;
        switch (value) {
            case NotificationChannel.EMAIL: return GrpcNotificationChannel.EMAIL;
            case NotificationChannel.PUSH: return GrpcNotificationChannel.PUSH;
            default: return GrpcNotificationChannel.CHANNEL_UNSPECIFIED;
        }
    }

    static fromGrpcNotificationChannel(value: GrpcNotificationChannel): NotificationChannel {
        switch (value.toString()) {
            case "EMAIL": return NotificationChannel.EMAIL;
            case "PUSH": return NotificationChannel.PUSH;
            default: throw new BadRequestException("Invalid Notification Channel");
        }
    }

    static toGrpcNotificationType(value: NotificationType): GrpcNotificationType {
        switch (value) {
            case NotificationType.TRANSACTIONAL: return GrpcNotificationType.TRANSACTIONAL;
            case NotificationType.SYSTEM_ALERT: return GrpcNotificationType.SYSTEM_ALERT;
            case NotificationType.CHAT: return GrpcNotificationType.CHAT;
            default: return GrpcNotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
        }
    }

    static fromGrpcNotificationType(value: GrpcNotificationType | undefined): NotificationType {
        if (!value) return NotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
        switch (value.toString()) {
            case "TRANSACTIONAL": return NotificationType.TRANSACTIONAL;
            case "SYSTEM_ALERT": return NotificationType.SYSTEM_ALERT;
            case "CHAT": return NotificationType.CHAT;
            default: return NotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
        }
    }
}