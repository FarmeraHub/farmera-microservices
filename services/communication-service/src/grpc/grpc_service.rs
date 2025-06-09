use farmera_grpc_proto::communication::{
    communication_service_server::CommunicationService, CheckOnlineUserRequest,
    CheckOnlineUserResponse, CreateConversationRequest, CreateConversationResponse,
    CreatePrivateConversationRequest, CreatePrivateConversationResponse, DeleteConversationRequest,
    DeleteConversationResponse, DeleteMessageRequest, DeleteMessageResponse,
    GetConversationMessagesRequest, GetConversationMessagesResponse,
    GetConversationParticipantsRequest, GetConversationParticipantsResponse,
    GetConversationRequest, GetConversationResponse, GetMessageRequest, GetMessageResponse,
    ListConversationsRequest, ListConversationsResponse,
};
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::{
    app::AppServices,
    models::{
        conversation::{MessageParams, NewConversation},
        Pagination,
    },
};

pub struct GrpcCommunicationService {
    app_services: AppServices,
}

impl GrpcCommunicationService {
    pub fn new(app_services: AppServices) -> Self {
        Self { app_services }
    }
}

#[tonic::async_trait]
impl CommunicationService for GrpcCommunicationService {
    // Conversation methods
    async fn create_conversation(
        &self,
        request: Request<CreateConversationRequest>,
    ) -> Result<Response<CreateConversationResponse>, Status> {
        let create_req = request.into_inner();

        let new_conversation =
            NewConversation::try_from(create_req).map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .conversation_service
            .create_conversation(&new_conversation.title)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(CreateConversationResponse::from(result)))
    }

    async fn get_conversation(
        &self,
        request: Request<GetConversationRequest>,
    ) -> Result<Response<GetConversationResponse>, Status> {
        let get_req = request.into_inner();
        let conversation_id = get_req.conversation_id;

        let result = self
            .app_services
            .conversation_service
            .get_conversation_by_id(conversation_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result.is_none() {
            Err(Status::not_found("Conversation not found"))
        } else {
            Ok(Response::new(GetConversationResponse::from(
                result.unwrap(),
            )))
        }
    }

    async fn list_conversations(
        &self,
        request: Request<ListConversationsRequest>,
    ) -> Result<Response<ListConversationsResponse>, Status> {
        let req = request.into_inner();
        let pagination = if req.pagination.is_some() {
            Pagination::try_from(req.pagination.unwrap())
                .map_err(|e| Status::invalid_argument(e))?
        } else {
            Pagination {
                limit: Some(10),
                page: Some(1),
            }
        };
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid UUID for user id"))?;

        let result = self
            .app_services
            .conversation_service
            .get_user_conversation(user_id, pagination)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(ListConversationsResponse::from(result)))
    }

    async fn delete_conversation(
        &self,
        request: Request<DeleteConversationRequest>,
    ) -> Result<Response<DeleteConversationResponse>, Status> {
        let delete_req = request.into_inner();
        let conversation_id = delete_req.conversation_id;

        let result = self
            .app_services
            .conversation_service
            .delete_conversation(conversation_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result > 0 {
            Ok(Response::new(DeleteConversationResponse { success: true }))
        } else {
            Ok(Response::new(DeleteConversationResponse { success: false }))
        }
    }

    async fn get_conversation_participants(
        &self,
        request: Request<GetConversationParticipantsRequest>,
    ) -> Result<Response<GetConversationParticipantsResponse>, Status> {
        let get_participants_req = request.into_inner();
        let conversation_id = get_participants_req.conversation_id;

        let result = self
            .app_services
            .conversation_service
            .get_conversation_participants(conversation_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(GetConversationParticipantsResponse::from(
            result,
        )))
    }

    async fn get_conversation_messages(
        &self,
        request: Request<GetConversationMessagesRequest>,
    ) -> Result<Response<GetConversationMessagesResponse>, Status> {
        let get_messages_req = request.into_inner();

        let params =
            MessageParams::try_from(get_messages_req).map_err(|e| Status::invalid_argument(e))?;
        let result = self
            .app_services
            .conversation_service
            .get_conversation_messages(
                get_messages_req.conversation_id,
                params.limit,
                params.before,
            )
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(GetConversationMessagesResponse::from(result)))
    }

    // Message methods
    async fn get_message(
        &self,
        request: Request<GetMessageRequest>,
    ) -> Result<Response<GetMessageResponse>, Status> {
        let get_msg_req = request.into_inner();
        let message_id = get_msg_req.message_id;

        let result = self
            .app_services
            .messages_service
            .get_message_by_id(message_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result.is_some() {
            Ok(Response::new(GetMessageResponse::from(result.unwrap())))
        } else {
            Err(Status::not_found("Message not found"))
        }
    }

    async fn delete_message(
        &self,
        request: Request<DeleteMessageRequest>,
    ) -> Result<Response<DeleteMessageResponse>, Status> {
        let delete_msg_req = request.into_inner();

        let message_id = delete_msg_req.message_id;
        self.app_services
            .messages_service
            .delete_message(message_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(DeleteMessageResponse { success: true }))
    }

    async fn check_online_user(
        &self,
        request: Request<CheckOnlineUserRequest>,
    ) -> Result<Response<CheckOnlineUserResponse>, Status> {
        let id = request.into_inner().user_id;

        let user_id =
            Uuid::parse_str(&id).map_err(|_| Status::invalid_argument("Invalid user id"))?;

        let result = self
            .app_services
            .user_service
            .check_online_user(user_id)
            .await
            .map_err(|_| Status::internal("Internal server error"))?;

        Ok(Response::new(CheckOnlineUserResponse { is_online: result }))
    }

    async fn create_private_conversation(
        &self,
        request: Request<CreatePrivateConversationRequest>,
    ) -> Result<Response<CreatePrivateConversationResponse>, Status> {
        let create_req = request.into_inner();

        let user_a = Uuid::parse_str(&create_req.user_a)
            .map_err(|_| Status::invalid_argument("Invalid UUID for user id"))?;
        let user_b = Uuid::parse_str(&create_req.user_b)
            .map_err(|_| Status::invalid_argument("Invalid UUID for user id"))?;

        let result = self
            .app_services
            .conversation_service
            .create_private_conversation(&create_req.title, user_a, user_b)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(CreatePrivateConversationResponse::from(
            result,
        )))
    }
}
