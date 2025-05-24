use std::sync::Arc;

use tokio::sync::Semaphore;

use super::Dispatcher;

#[allow(dead_code)]
pub struct DispatcherWrapper {
    dispatcher: Arc<dyn Dispatcher>,
    limiter: Arc<Semaphore>,
}

#[allow(dead_code)]
impl DispatcherWrapper {
    pub fn new(dispatcher: Arc<dyn Dispatcher>, max_concuurent: usize) -> Self {
        Self {
            dispatcher,
            limiter: Arc::new(Semaphore::new(max_concuurent)),
        }
    }

    pub async fn handle(&self, msg: &str) {
        let dispatcher = self.dispatcher.clone();
        let permit = self.limiter.clone().acquire_owned().await.unwrap();
        let msg = msg.to_owned();
        tokio::spawn(async move {
            let _result = dispatcher.send(&msg).await;
            drop(permit);
        });
    }
}
