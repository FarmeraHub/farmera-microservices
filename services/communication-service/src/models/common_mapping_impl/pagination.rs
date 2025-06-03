use farmera_grpc_proto::SimplePaginationRequest;

use crate::models::Pagination;

impl TryFrom<SimplePaginationRequest> for Pagination {
    type Error = &'static str;

    fn try_from(value: SimplePaginationRequest) -> Result<Self, Self::Error> {
        let limit = if value.limit.is_none() {
            Some(10)
        } else {
            value.limit
        };

        let page = if value.page.is_none() {
            Some(1)
        } else {
            value.page
        };

        Ok(Pagination { page, limit })
    }
}
