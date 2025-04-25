use actix_multipart::form::{tempfile::TempFile, MultipartForm};

#[derive(MultipartForm)]
pub struct UploadForm {
    #[multipart(rename = "file")] // match with client form field
    pub files: Vec<TempFile>,
}
