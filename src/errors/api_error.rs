use ::thiserror::Error;

#[derive(Debug, Error)]
pub enum APIError {
    #[error("Not found: {}", _0)]
    NotFound(String),
}
