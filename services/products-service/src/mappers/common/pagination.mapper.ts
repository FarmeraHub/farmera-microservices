import { PaginationRequest, PaginationResponse } from "@farmera/grpc-proto/dist/common/pagination";
import { PaginationMeta } from "src/pagination/dto/pagination-meta.dto";
import { Order, PaginationOptions } from "src/pagination/dto/pagination-options.dto";
import { EnumsMapper } from "./enums.mapper";

export class PaginationMapper {
    static fromGrpcPaginationRequest(pagination?: PaginationRequest): PaginationOptions {
        if (!pagination) return {
            page: 1,
            limit: 10,
            order: Order.ASC,
            all: false,
            skip: 0
        };

        return {
            page: pagination.page ?? 1,
            limit: pagination.limit ?? 10,
            order: EnumsMapper.fromGrpcPaginationOrder(pagination.order),
            all: pagination.all ?? false,
            sort_by: pagination.sort_by,
            skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 10)
        }
    }

    static toGrpcPaginationResponse(value: PaginationMeta | undefined): PaginationResponse | undefined {
        if (!value) return undefined;
        return {
            current_page: value.page,
            page_size: value.limit,
            total_items: value.totalItems,
            total_pages: value.totalPages,
            has_next_page: value.hasNextPage,
            has_previous_page: value.hasPreviousPage,
        }
    }
}