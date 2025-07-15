import { PaginationOrder as GrpcPaginationOrder } from "@farmera/grpc-proto/dist/common/enums";
import { PaginationRequest, PaginationResponse, SimpleCursorPaginationRequest } from "@farmera/grpc-proto/dist/common/pagination";
import { BadRequestException } from "@nestjs/common";
import { PaginationMeta } from "src/pagination/dto/pagination-meta.dto";
import { EnumMapper } from "./enum.mapper";
import { Order, PaginationOptions } from "src/pagination/dto/pagination-options.dto";
import { SimpleCursorPagination } from "src/pagination/dto/pagination-simple.dto";

export class PaginationMapper {
    static fromGrpcPaginationOrder(value?: GrpcPaginationOrder): Order {
        if (!value) throw new BadRequestException("Invalid value");
        switch (value.toString()) {
            case "ASC": return Order.ASC;
            case "DESC": return Order.DESC;
            default: throw new BadRequestException("Invalid value");
        }
    }

    static toGrpcPaginationOrder(value?: Order): GrpcPaginationOrder {
        if (!value) return GrpcPaginationOrder.ORDER_UNSPECIFIED;
        switch (value) {
            case Order.ASC: return GrpcPaginationOrder.ASC;
            case Order.DESC: return GrpcPaginationOrder.DESC;
            default: return GrpcPaginationOrder.ORDER_UNSPECIFIED;
        }
    }

    static toGrpcSimpleCursorPaginationRequest(value: SimpleCursorPagination): SimpleCursorPaginationRequest {
        return {
            sort_by: value.sort_by,
            limit: value.limit,
            order: this.toGrpcPaginationOrder(value.order as Order),
            cursor: value.cursor,
        }
    }

    static toGrpcPaginationRequest(pagination: PaginationOptions): PaginationRequest {
        return {
            page: pagination.page,
            limit: pagination.limit,
            sort_by: pagination.sort_by,
            order: EnumMapper.toGrpcSortOrder(pagination.order as Order),
            all: pagination.all
        }
    }

    static fromGrpcPaginationResponse(value?: PaginationResponse): PaginationMeta | undefined {
        if (!value) return undefined;
        return {
            page: value.current_page,
            limit: value.page_size,
            totalItems: value.total_items,
            totalPages: value.total_pages,
            hasPreviousPage: value.has_previous_page,
            hasNextPage: value.has_next_page,
        }
    }
}