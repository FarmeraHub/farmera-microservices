import { PaginationResponse } from "@farmera/grpc-proto/dist/common/pagination";

export class PaginationMapper {
    static toPaginationResponse(
        total: number,
        page: number,
        limit: number,
    ): PaginationResponse {
        return {
            total_items: total,
            total_pages: Math.ceil(total / limit),
            current_page: page,
            page_size: limit,
            has_next_page: page * limit < total,
            has_previous_page: page > 1,
            // next_cursor: page * limit < total ? page + 1 + '' : '',
            // previous_cursor: page > 0 ? page - 1 + '' : ''
        };
    }
}