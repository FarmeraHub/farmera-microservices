use rdkafka::{Message, consumer::StreamConsumer};

use super::processor_trait::Processor;

pub struct PushProcessor {
    pub push_consumer: StreamConsumer,
}

impl Processor for PushProcessor {
    fn new(consumer: StreamConsumer) -> Self {
        Self {
            push_consumer: consumer,
        }
    }

    async fn run(self) -> std::io::Result<()> {
        loop {
            match self.push_consumer.recv().await {
                Ok(message) => {
                    let payload = match message.payload_view::<str>() {
                        None => "",
                        Some(Ok(s)) => s,
                        Some(Err(e)) => {
                            log::warn!("Error while deserializing message payload: {:?}", e);
                            ""
                        }
                    };
                    log::info!(
                        "key: '{:?}', payload: '{}', topic: {}, partition: {}, offset: {}, timestamp: {:?}",
                        message.key(),
                        payload,
                        message.topic(),
                        message.partition(),
                        message.offset(),
                        message.timestamp()
                    );
                }
                Err(e) => {
                    log::error!("Kafka error: {e}");
                }
            }
        }
    }
}
