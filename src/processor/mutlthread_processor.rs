use rdkafka::{Message, consumer::StreamConsumer};

use crate::dispatchers::dispatcher_wrapper::DispatcherWrapper;

#[allow(dead_code)]
pub struct MultiThreadProcessor {
    pub push_consumer: StreamConsumer,
    pub dispatcher: DispatcherWrapper,
}

#[allow(dead_code)]
impl MultiThreadProcessor {
    pub fn new(consumer: StreamConsumer, dispatcher: DispatcherWrapper) -> Self {
        Self {
            push_consumer: consumer,
            dispatcher,
        }
    }

    pub async fn run(self) -> std::io::Result<()> {
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
                        "key: '{:?}', payload: '{:?}', topic: {}, partition: {}, offset: {}, timestamp: {:?}",
                        message.key(),
                        payload,
                        message.topic(),
                        message.partition(),
                        message.offset(),
                        message.timestamp()
                    );

                    self.dispatcher.handle(&payload.to_string()).await;
                }
                Err(e) => {
                    log::error!("Kafka error: {e}");
                }
            }
        }
    }
}
