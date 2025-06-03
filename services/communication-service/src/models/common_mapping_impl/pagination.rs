use farmera_grpc_proto::SimplePaginationRequest;

use crate::models::Pagination;

impl From<SimplePaginationRequest> for Pagination {
    fn from(value: SimplePaginationRequest) -> Self {
        Pagination {
            page: value.page,
            limit: value.limit,
        }
    }
}
