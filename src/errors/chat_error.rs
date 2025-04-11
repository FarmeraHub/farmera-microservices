use thiserror::Error;

#[derive(Debug, Error)]
pub enum ChatError {
    #[error("Joining conversation error: {}", _0)]
    JoinError(String),
    #[error("Messaging error: {}", _0)]
    MessageError(String),
}
