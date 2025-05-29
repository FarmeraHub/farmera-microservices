use farmera_grpc_proto::notification::{
    notification_service_client::NotificationServiceClient, GetUserDevicesRequest,
    GetUserDevicesResponse, SendPushNotificationRequest, SendPushNotificationResponse,
};
use tonic::{transport::Channel, Status};

use crate::models::notification_models::push::PushMessage;

#[derive(Clone)]
pub struct NotificationGrpcClient {
    inner: NotificationServiceClient<Channel>,
}

impl NotificationGrpcClient {
    pub async fn connect(addr: String) -> Result<Self, tonic::transport::Error> {
        let inner = NotificationServiceClient::connect(addr).await?;
        Ok(Self { inner })
    }

    pub async fn get_user_device_token(
        &mut self,
        user_id: String,
    ) -> Result<GetUserDevicesResponse, Status> {
        let request = GetUserDevicesRequest { user_id };
        let response = self.inner.get_user_devices(request).await?;
        Ok(response.into_inner())
    }

    pub async fn send_push_notification(
        &mut self,
        push_message: PushMessage,
    ) -> Result<SendPushNotificationResponse, Status> {
        let request = SendPushNotificationRequest::from(push_message);
        let response = self.inner.send_push_notification(request).await?;
        Ok(response.into_inner())
    }
}
