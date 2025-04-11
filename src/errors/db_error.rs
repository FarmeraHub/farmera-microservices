use ::thiserror::Error;

#[derive(Debug, Error)]
pub enum DBError {
    #[error("Query failed: {}", _0)]
    QueryError(sqlx::Error),
}
