use std::time::Duration;

use rdkafka::{
    ClientConfig,
    admin::{AdminClient, AdminOptions, NewTopic},
    client::DefaultClientContext,
    consumer::{Consumer, StreamConsumer},
    producer::FutureProducer,
};

pub fn create_consumer(brokers: &str, group_id: &str, topics: &[&str]) -> StreamConsumer {
    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", group_id)
        .set("bootstrap.servers", brokers)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest")
        .set("heartbeat.interval.ms", "3000")
        .create()
        .expect("Consumer creation failed");

    consumer
        .subscribe(&topics.to_vec())
        .expect("Can't subscribe to specified topics");

    consumer
}

pub fn create_producer(brokers: &str) -> FutureProducer {
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .create()
        .expect("Producer creation failed");

    producer
}

pub async fn create_topic(brokers: &str, topic_name: &str, num_partitions: i32, replication: i32) {
    let admin_client: AdminClient<DefaultClientContext> = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .create()
        .expect("Admin client creation failed");

    let topic = NewTopic::new(
        topic_name,
        num_partitions,
        rdkafka::admin::TopicReplication::Fixed(replication),
    );

    match admin_client
        .create_topics(&[topic], &AdminOptions::new())
        .await
    {
        Ok(_) => {
            log::info!("Topic {topic_name} created");
        }
        Err(e) => {
            log::error!("Error creating topic: {e}");
            panic!("Error creating topic: {e}")
        }
    }
}

pub async fn _wait_for_kafka_ready(brokers: &str) {
    let mut attempt = 0;

    loop {
        attempt += 1;
        let admin: Result<AdminClient<_>, _> = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .create();

        match admin {
            Ok(_) => {
                log::info!("Kafka is ready");
                break;
            }
            Err(err) => {
                log::warn!("Kafka not ready yet (attempt {attempt}): {err}");
                tokio::time::sleep(Duration::from_secs(2)).await;
                if attempt >= 10 {
                    panic!("Kafka not ready after 10 attempts");
                }
            }
        }
    }
}
