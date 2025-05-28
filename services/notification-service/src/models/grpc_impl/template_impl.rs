use farmera_grpc_proto::notification::{
    CreateTemplateRequest, CreateTemplateResponse, GetTemplateResponse,
};

use crate::models::template::{NewTemplate, Template};

use super::datetime_to_grpc_timestamp;

impl From<Template> for GetTemplateResponse {
    fn from(value: Template) -> Self {
        GetTemplateResponse {
            template_id: value.template_id,
            name: value.name,
            content: value.content,
            created: Some(datetime_to_grpc_timestamp(value.created)),
            updated: Some(datetime_to_grpc_timestamp(value.updated)), //prost_wkt_types
        }
    }
}

impl TryFrom<CreateTemplateRequest> for NewTemplate {
    type Error = &'static str;

    fn try_from(value: CreateTemplateRequest) -> Result<Self, Self::Error> {
        if value.name.is_empty() || value.content.is_empty() {
            return Err("Title or content cannot be empty");
        }

        Ok(NewTemplate {
            name: value.name,
            content: value.content,
        })
    }
}

impl From<Template> for CreateTemplateResponse {
    fn from(value: Template) -> Self {
        CreateTemplateResponse {
            template_id: value.template_id,
            name: value.name,
            content: value.content,
            created: Some(datetime_to_grpc_timestamp(value.created)),
            updated: Some(datetime_to_grpc_timestamp(value.updated)), //prost_wkt_types
        }
    }
}
