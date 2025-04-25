use actix_multipart::form::{tempfile::TempFile, MultipartForm};
use utoipa::ToSchema;

#[derive(MultipartForm)]
pub struct UploadForm {
    #[multipart(rename = "file")] // match with client form field
    pub files: Vec<TempFile>,
}

#[allow(dead_code)]
#[derive(ToSchema)]
pub struct UploadFormSchema {
    /// Multiple files to upload
    #[schema(value_type = String, format = Binary, example = json!("file1.png"))]
    pub file: String,
}
