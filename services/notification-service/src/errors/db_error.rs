use ::thiserror::Error;

#[derive(Debug, Error)]
pub enum DBError {
    #[error("Query failed: {}", _0)]
    QueryError(sqlx::Error),

    #[error("Query failed: {}", _0)]
    QueryFailed(String),

    #[error("Not found: {}", _0)]
    NotFound(String),
}
