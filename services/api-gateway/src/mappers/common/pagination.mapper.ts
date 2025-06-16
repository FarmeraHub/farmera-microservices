import { PaginationOrder as GrpcPaginationOrder } from "@farmera/grpc-proto/dist/common/enums";
import { SimpleCursorPaginationRequest } from "@farmera/grpc-proto/dist/common/pagination";
import { SimpleCursorPagination } from "src/common/dto/pagination.dto";
import { PaginationOrder } from "src/enums/pagination.enums";

export class PaginationMapper {
    static fromGrpcPaginationOrder(value?: GrpcPaginationOrder): PaginationOrder {
        if (!value) return PaginationOrder.UNSPECIFIED;
        switch (value.toString()) {
            case "ASC": return PaginationOrder.ASC;
            case "DESC": return PaginationOrder.DESC;
            default: return PaginationOrder.UNSPECIFIED;
        }
    }

    static toGrpcPaginationOrder(value?: PaginationOrder): GrpcPaginationOrder {
        if (!value) return GrpcPaginationOrder.ORDER_UNSPECIFIED;
        switch (value) {
            case PaginationOrder.ASC: return GrpcPaginationOrder.ASC;
            case PaginationOrder.DESC: return GrpcPaginationOrder.DESC;
            default: return GrpcPaginationOrder.ORDER_UNSPECIFIED;
        }
    }

    static toGrpcSimpleCursorPaginationRequest(value: SimpleCursorPagination): SimpleCursorPaginationRequest {
        return {
            limit: value.limit,
            order: this.toGrpcPaginationOrder(value.order),
            cursor: value.cursor,
        }
    }
}