use rdkafka::consumer::StreamConsumer;

pub trait Processor {
    fn new(consumer: StreamConsumer) -> Self;
    async fn run(self) -> std::io::Result<()>;
}
