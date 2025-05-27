use std::sync::Arc;

use actix::{Actor, AsyncContext, Context, Handler, WrapFuture};

use crate::processor::actor_processor;

use super::Dispatcher;

pub struct DispatcherActor {
    dispatcher: Arc<dyn Dispatcher>,
}

impl DispatcherActor {
    pub fn new(dispatcher: Arc<dyn Dispatcher>) -> Self {
        Self { dispatcher }
    }
}

impl Actor for DispatcherActor {
    type Context = Context<Self>;
}

impl Handler<actor_processor::Msg> for DispatcherActor {
    type Result = ();

    fn handle(&mut self, msg: actor_processor::Msg, ctx: &mut Self::Context) -> Self::Result {
        let dispatcher = self.dispatcher.clone();
        ctx.spawn(
            async move {
                if let Err(e) = dispatcher.send(&msg.0).await {
                    log::error!("{e}");
                    // !TODO: handle error
                }
            }
            .into_actor(self),
        );
    }
}
