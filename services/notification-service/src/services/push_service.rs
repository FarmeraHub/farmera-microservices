use std::{sync::Arc, time::Duration};

use rdkafka::producer::{FutureProducer, FutureRecord};

use crate::{errors::kafka_error::KafkaError, models::push};

pub struct PushService {
    producer: Arc<FutureProducer>,
}

impl PushService {
    pub fn new(producer: Arc<FutureProducer>) -> Self {
        Self { producer }
    }

    pub async fn send_push(&self, message: &push::PushMessage) -> Result<(), KafkaError> {
        let message = &serde_json::to_string(&message).unwrap();
        let _status = self
            .producer
            .send(
                FutureRecord::to("push").payload(message).key("key"),
                Duration::from_secs(0),
            )
            .await
            .map_err(|e| {
                log::error!("{}", e.0);
                KafkaError::Error(e.0)
            })?;

        Ok(())
    }
}
