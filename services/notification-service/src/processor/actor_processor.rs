use actix::Recipient;
use rdkafka::{Message, consumer::StreamConsumer};

#[derive(actix::Message)]
#[rtype(result = "()")]
pub struct Msg(pub String);

pub struct ActorProcessor {
    pub consumer: StreamConsumer,
    pub dispatcher: Recipient<Msg>,
}

impl ActorProcessor {
    pub fn new(consumer: StreamConsumer, dispatcher: Recipient<Msg>) -> Self {
        Self {
            consumer: consumer,
            dispatcher,
        }
    }

    pub async fn run(self) -> std::io::Result<()> {
        loop {
            match self.consumer.recv().await {
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

                    let _ = self.dispatcher.send(Msg(payload.to_string())).await;
                }
                Err(e) => {
                    log::error!("Kafka error: {e}");
                }
            }
        }
    }
}
