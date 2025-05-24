use actix::fut::{Ready, ready};
use actix_web::{
    Error, HttpMessage, HttpResponse,
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
};
use futures_util::{FutureExt, future::LocalBoxFuture};

use crate::{models::reponse_wrapper::ResponseWrapper, utils::jwt_utils::Claims};

pub struct RBACMiddleware;

impl<S, B> Transform<S, ServiceRequest> for RBACMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;

    type Error = Error;

    type Transform = RBACMiddlewareService<S>;

    type InitError = ();

    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RBACMiddlewareService { service }))
    }
}

pub struct RBACMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for RBACMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;

    type Error = Error;

    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        log::info!("rbac middleware");
        // get user info
        let user_info = req.extensions().get::<Claims>().cloned();

        match user_info {
            Some(info) => {
                if !has_permission(&info) {
                    let http_res = HttpResponse::Forbidden().finish();
                    let (http_req, _) = req.into_parts();
                    let res = ServiceResponse::new(http_req, http_res);
                    return (async move { Ok(res.map_into_right_body()) }).boxed_local();
                } else {
                    let fut = self.service.call(req);
                    return Box::pin(async move {
                        let res = fut.await?;
                        Ok(res.map_into_left_body())
                    });
                }
            }
            None => {
                // Claims is missing, return error
                log::error!("Claims is missing");
            }
        };

        // return unauthorized
        let http_res = ResponseWrapper::<()>::build(
            actix_web::http::StatusCode::UNAUTHORIZED,
            "Unauthorized",
            None,
        );
        let (http_req, _) = req.into_parts();
        let res = ServiceResponse::new(http_req, http_res);

        return (async move { Ok(res.map_into_right_body()) }).boxed_local();
    }
}

fn has_permission(info: &Claims) -> bool {
    todo!()
}
