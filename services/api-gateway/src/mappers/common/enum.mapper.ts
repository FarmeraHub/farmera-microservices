import { FarmStatus as GrpcFarmStatus, MessageType as GrpcMessageType, IdentificationStatus as GrpcIdentificationStatus, IdentificationMethod as GrpcIdentificationMethod, ProductStatus as GrpcProductStatus, PaginationOrder } from "@farmera/grpc-proto/dist/common/enums";
import { MessageType } from "src/communication/enums/message-type.enums";
import { FarmStatus } from "src/common/enums/product/farm-status.enum";
import { ProductStatus } from "src/common/enums/product/product-status.enum";
import { IdentificationMethod, IdentificationStatus } from "src/product/farm/entities/identification.entity";
import { Order } from "src/pagination/dto/pagination-options.dto";

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
}