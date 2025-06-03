use farmera_grpc_proto::notification::{
    CreateNotificationRequest, CreateNotificationResponse, CreateTemplateNotificationRequest,
    CreateTemplateNotificationResponse, CreateTemplateRequest, CreateTemplateResponse,
    CreateUserDeviceTokenRequest, CreateUserDeviceTokenResponse, CreateUserPreferencesRequest,
    CreateUserPreferencesResponse, DeleteUserDeviceTokenRequest, DeleteUserDeviceTokenResponse,
    GetTemplateRequest, GetTemplateResponse, GetUserDevicesRequest, GetUserDevicesResponse,
    GetUserPreferencesRequest, GetUserPreferencesResponse, SendEmailNotificationRequest,
    SendEmailNotificationResponse, SendNotificationRequest, SendNotificationResponse,
    SendPushNotificationRequest, SendPushNotificationResponse, UpdateUserPreferencesRequest,
    UpdateUserPreferencesResponse, notification_service_server::NotificationService,
};
use notification_service::{
    app::AppServices,
    models::{
        email::EmailMessage,
        notification::{NewNotification, NewTemplateNotification, SendNotification},
        push::PushMessage,
        template::NewTemplate,
        user_preferences::{NewUserPreferences, UserDeviceToken},
    },
};
use tonic::{Request, Response, Status};
use uuid::Uuid;

pub struct GrpcNotificationService {
    app_services: AppServices,
}

impl GrpcNotificationService {
    pub fn new(app_services: AppServices) -> Self {
        Self { app_services }
    }
}

#[tonic::async_trait]
impl NotificationService for GrpcNotificationService {
    // Notification methods
    async fn create_notification(
        &self,
        request: Request<CreateNotificationRequest>,
    ) -> Result<Response<CreateNotificationResponse>, Status> {
        let create_notification_req = request.into_inner();

        let mut new_notification = NewNotification::try_from(create_notification_req)
            .map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .notification_service
            .create_notification(&mut new_notification)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(CreateNotificationResponse::from(result)))
    }

    async fn create_template_notification(
        &self,
        request: Request<CreateTemplateNotificationRequest>,
    ) -> Result<Response<CreateTemplateNotificationResponse>, Status> {
        let new_template_notification_req = request.into_inner();

        let new_template_notification =
            NewTemplateNotification::try_from(new_template_notification_req)
                .map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .notification_service
            .create_template_notification(&new_template_notification)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result.is_some() {
            Ok(Response::new(CreateTemplateNotificationResponse::from(
                result.unwrap(),
            )))
        } else {
            Err(Status::not_found("Template not found"))
        }
    }

    // Template methods
    async fn get_template(
        &self,
        request: Request<GetTemplateRequest>,
    ) -> Result<Response<GetTemplateResponse>, Status> {
        let template_id = request.into_inner().template_id;

        let result = self
            .app_services
            .template_service
            .get_template_by_id(template_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result.is_some() {
            Ok(Response::new(GetTemplateResponse::from(result.unwrap())))
        } else {
            Err(Status::not_found("Template not found"))
        }
    }

    async fn create_template(
        &self,
        request: Request<CreateTemplateRequest>,
    ) -> Result<Response<CreateTemplateResponse>, Status> {
        let create_template_req = request.into_inner();

        let new_template =
            NewTemplate::try_from(create_template_req).map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .template_service
            .create_template(&new_template)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(CreateTemplateResponse::from(result)))
    }

    // Send methods
    async fn send_notification(
        &self,
        request: Request<SendNotificationRequest>,
    ) -> Result<Response<SendNotificationResponse>, Status> {
        let send_req = request.into_inner();

        let send_message =
            SendNotification::try_from(send_req).map_err(|e| Status::invalid_argument(e))?;

        let _ = self
            .app_services
            .send_service
            .send(&send_message)
            .await
            .map_err(|e| Status::from_error(Box::new(e)));

        Ok(Response::new(SendNotificationResponse {
            message: "Queued".to_string(),
            success: true,
        }))
    }

    async fn send_push_notification(
        &self,
        request: Request<SendPushNotificationRequest>,
    ) -> Result<Response<SendPushNotificationResponse>, Status> {
        let send_req = request.into_inner();

        let push_message =
            PushMessage::try_from(send_req).map_err(|e| Status::invalid_argument(e))?;

        let _ = self
            .app_services
            .send_service
            .push_service
            .send_push(&push_message)
            .await
            .map_err(|_| Status::internal("Message queue error"))?;

        Ok(Response::new(SendPushNotificationResponse {
            message: "Queued".to_string(),
            success: true,
        }))
    }

    async fn send_email_notification(
        &self,
        request: Request<SendEmailNotificationRequest>,
    ) -> Result<Response<SendEmailNotificationResponse>, Status> {
        let send_req = request.into_inner();

        let email_message =
            EmailMessage::try_from(send_req).map_err(|e| Status::invalid_argument(e))?;

        let _ = self
            .app_services
            .send_service
            .email_service
            .send_email(&email_message)
            .await
            .map_err(|_| Status::internal("Message queue error"))?;

        Ok(Response::new(SendEmailNotificationResponse {
            message: "Queued".to_string(),
            success: true,
        }))
    }

    // User preferences methods
    async fn create_user_preferences(
        &self,
        request: Request<CreateUserPreferencesRequest>,
    ) -> Result<Response<CreateUserPreferencesResponse>, Status> {
        let create_req = request.into_inner();

        let mut new_user_preferences =
            NewUserPreferences::try_from(create_req).map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .user_preferences_service
            .create_user_preferences(&mut new_user_preferences)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(CreateUserPreferencesResponse::from(result)))
    }

    async fn update_user_preferences(
        &self,
        request: Request<UpdateUserPreferencesRequest>,
    ) -> Result<Response<UpdateUserPreferencesResponse>, Status> {
        let update_user_req = request.into_inner();

        let new_user_preferences = NewUserPreferences::try_from(update_user_req)
            .map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .user_preferences_service
            .update_user_preferences(&new_user_preferences)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(UpdateUserPreferencesResponse::from(result)))
    }

    async fn get_user_preferences(
        &self,
        request: Request<GetUserPreferencesRequest>,
    ) -> Result<Response<GetUserPreferencesResponse>, Status> {
        let req = request.into_inner();
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid UUID format for user_id"))?;

        let result = self
            .app_services
            .user_preferences_service
            .get_user_preferences_by_user_id(user_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result.is_some() {
            Ok(Response::new(GetUserPreferencesResponse::from(
                result.unwrap(),
            )))
        } else {
            Err(Status::not_found("User preference not found"))
        }
    }

    // User devices methods
    async fn create_user_device_token(
        &self,
        request: Request<CreateUserDeviceTokenRequest>,
    ) -> Result<Response<CreateUserDeviceTokenResponse>, Status> {
        let create_req = request.into_inner();

        let user_device_token =
            UserDeviceToken::try_from(create_req).map_err(|e| Status::invalid_argument(e))?;

        let result = self
            .app_services
            .user_devices_service
            .create_user_device_token(&user_device_token)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(CreateUserDeviceTokenResponse::from(result)))
    }

    async fn get_user_devices(
        &self,
        request: Request<GetUserDevicesRequest>,
    ) -> Result<Response<GetUserDevicesResponse>, Status> {
        let user_id = Uuid::parse_str(&request.into_inner().user_id)
            .map_err(|_| Status::invalid_argument("Invalid UUID format for user_id"))?;

        let result = self
            .app_services
            .user_devices_service
            .get_user_device_token(user_id)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        Ok(Response::new(GetUserDevicesResponse {
            device_token: result,
        }))
    }

    async fn delete_user_device_token(
        &self,
        request: Request<DeleteUserDeviceTokenRequest>,
    ) -> Result<Response<DeleteUserDeviceTokenResponse>, Status> {
        let req = request.into_inner();

        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid UUID format for user_id"))?;
        let device_token = req.device_token;

        let result = self
            .app_services
            .user_devices_service
            .delete_user_device_token(user_id, &device_token)
            .await
            .map_err(|e| Status::from_error(Box::new(e)))?;

        if result != 0 {
            Ok(Response::new(DeleteUserDeviceTokenResponse {
                success: true,
            }))
        } else {
            Ok(Response::new(DeleteUserDeviceTokenResponse {
                success: false,
            }))
        }
    }
}
