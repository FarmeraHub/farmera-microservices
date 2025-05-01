use rdkafka::{Message, consumer::StreamConsumer};

use super::processor_trait::Processor;

pub struct EmailProcessor {
    email_consumer: StreamConsumer,
}

impl Processor for EmailProcessor {
    fn new(consumer: StreamConsumer) -> Self {
        Self {
            email_consumer: consumer,
        }
    }

    async fn run(self) -> std::io::Result<()> {
        loop {
            match self.email_consumer.recv().await {
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
