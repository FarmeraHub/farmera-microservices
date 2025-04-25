use ::thiserror::Error;

#[derive(Debug, Error)]
pub enum FileError {
    #[error("Invalid content type")]
    InvalidContentType,

    #[error("File too large: {}", _0)]
    FileTooLarge(String),

    #[error("Forbidden")]
    Forbidden,

    #[error("File not found")]
    FileNotFound,

    #[error("File open failed: {}", _0)]
    OpenError(String),

    #[error("Invalid file: {}", _0)]
    InvalidFile(String),
}
