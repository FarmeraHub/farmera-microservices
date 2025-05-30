use std::time::Duration;

use failsafe::{
    backoff, failure_policy::ConsecutiveFailures, futures::CircuitBreaker, StateMachine,
};
use farmera_grpc_proto::notification::{
    notification_service_client::NotificationServiceClient, GetUserDevicesRequest,
    GetUserDevicesResponse, SendPushNotificationRequest, SendPushNotificationResponse,
};
use futures_util::future::BoxFuture;
use tokio::time::timeout;
use tonic::{transport::Channel, Response, Status};

use crate::models::notification_models::push::PushMessage;

const CONNECTION_TIMEOUT: Duration = Duration::from_secs(5);
const RPC_TIMEOUT: Duration = Duration::from_secs(3);

#[derive(Clone)]
pub struct NotificationGrpcClient {
    inner: Option<NotificationServiceClient<Channel>>,
    circuit_breaker: StateMachine<ConsecutiveFailures<backoff::Exponential>, ()>,
    addr: String,
}

impl NotificationGrpcClient {
    pub async fn connect(addr: String) -> Self {
        // try to connec to notification service

        let inner = Self::try_connect(addr.clone())
            .await
            .map_err(|e| {
                log::error!("Cannot connect to notification service - error: {e}");
            })
            .ok();

        // create an exponential growth backoff(delay between invokes) which starts from 10s and ends with 60s.
        let backoff =
            failsafe::backoff::exponential(Duration::from_secs(10), Duration::from_secs(60));
        // create a policy which failed when three consecutive failures were made.
        let policy = failsafe::failure_policy::consecutive_failures(3, backoff);
        // creates a circuit breaker with given policy.
        let circuit_breaker: StateMachine<ConsecutiveFailures<backoff::Exponential>, ()> =
            failsafe::Config::new().failure_policy(policy).build();

        Self {
            inner,
            circuit_breaker,
            addr,
        }
    }

    async fn try_connect(addr: String) -> Result<NotificationServiceClient<Channel>, Status> {
        let connect_fut = NotificationServiceClient::connect(addr.clone());
        let result = timeout(CONNECTION_TIMEOUT, connect_fut).await;
        match result {
            Ok(Ok(client)) => Ok(client),
            Ok(Err(err)) => {
                log::error!("Connect failed: {err}");
                return Err(Status::unavailable(
                    "Unable to connect to notification service",
                ));
            }
            Err(_) => {
                log::error!("Connect to notification service timed out");
                return Err(Status::deadline_exceeded("Connection timed out"));
            }
        }
    }

    async fn reconnect(&mut self) -> Result<(), Status> {
        // failure predicate definition
        fn always_fail<E>(_err: &E) -> bool {
            true
        }

        let client_fut = Self::try_connect(self.addr.clone());

        match self
            .circuit_breaker
            .call_with(always_fail, client_fut)
            .await
        {
            Err(e) => match e {
                failsafe::Error::Rejected => {
                    log::error!("Circuit breaker is open; request rejected");
                    Err(Status::unavailable(
                        "Circuit breaker is open; request rejected",
                    ))
                }
                failsafe::Error::Inner(err) => Err(err),
            },
            Ok(result) => {
                self.inner = Some(result);
                Ok(())
            }
        }
    }

    async fn circuit_breaker_call<T, F>(&mut self, call: F) -> Result<T, Status>
    where
        F: FnOnce(&mut NotificationServiceClient<Channel>) -> BoxFuture<'_, Result<T, Status>>,
    {
        // reconnect
        if self.inner.is_none() {
            self.reconnect().await?;
        }

        // ensure notification service client is available
        let client = self
            .inner
            .as_mut()
            .ok_or_else(|| Status::unavailable("No connection to notification service"))?;

        // failure predicate definition
        fn always_fail<E>(_err: &E) -> bool {
            true
        }

        match self
            .circuit_breaker
            .call_with(always_fail, async {
                // handle timeout
                match timeout(RPC_TIMEOUT, call(client)).await {
                    Ok(Ok(resp)) => Ok(resp),
                    Ok(Err(err)) => Err(err),
                    Err(_) => {
                        log::error!("RPC call timed out");
                        Err(Status::deadline_exceeded("RPC call timed out"))
                    }
                }
            })
            .await
        {
            Err(e) => match e {
                failsafe::Error::Rejected => {
                    log::error!("Circuit breaker is open; request rejected");
                    Err(Status::unavailable(
                        "Circuit breaker is open; request rejected",
                    ))
                }
                failsafe::Error::Inner(err) => {
                    log::error!("Call failed: {}", err);
                    Err(err)
                }
            },
            Ok(result) => Ok(result),
        }
    }

    pub async fn get_user_device_token(
        &mut self,
        user_id: String,
    ) -> Result<Response<GetUserDevicesResponse>, Status> {
        let user_id = user_id.clone();
        self.circuit_breaker_call(move |client| {
            let request = GetUserDevicesRequest { user_id };
            Box::pin(client.get_user_devices(request))
        })
        .await
    }

    pub async fn send_push_notification(
        &mut self,
        push_message: PushMessage,
    ) -> Result<Response<SendPushNotificationResponse>, Status> {
        self.circuit_breaker_call(move |client| {
            let request = SendPushNotificationRequest::from(push_message);
            Box::pin(client.send_push_notification(request))
        })
        .await
    }
}
