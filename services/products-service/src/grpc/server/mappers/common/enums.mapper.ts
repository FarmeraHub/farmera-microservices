import { FarmStatus as GrpcFarmStatus, IdentificationMethod as GrpcIdentificationMethod, IdentificationStatus as GrpcIdentificationStatus, ProductStatus as GrpcProductStatus, PaginationOrder as GrpcPaginationOrder } from "@farmera/grpc-proto/dist/common/enums";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { FarmStatus } from "src/common/enums/farm-status.enum";
import { ProductStatus } from "src/common/enums/product-status.enum";
import { IdentificationMethod, IdentificationStatus } from "src/farms/entities/identification.entity";
import { Order } from "src/pagination/dto/pagination-options.dto";

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
            default: return undefined;
        }
    }
}