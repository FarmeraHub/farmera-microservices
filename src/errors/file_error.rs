use ::thiserror::Error;

#[derive(Debug, Error)]
pub enum FileError {
    #[error("Invalid content type")]
    InvalidContentType,

    #[error("File too large: {}", _0)]
    FileTooLarge(String),

    #[error("Persisting a temporary file fails")]
    PersistError(String),
    // #[error("Missing file field failed: {}", _0)]
    // MissingFileField(String),

    // #[error("Mime detection failed")]
    // MimeDetectionFailed,
}
