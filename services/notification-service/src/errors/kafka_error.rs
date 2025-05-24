use thiserror::Error;

#[derive(Debug, Error)]
pub enum KafkaError {
    #[error("Kafka error: {}", _0)]
    Error(rdkafka::error::KafkaError),
}
