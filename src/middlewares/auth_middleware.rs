use actix::fut::{Ready, ready};
use actix_web::{
    Error, HttpMessage, HttpResponse,
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
    http::header::AUTHORIZATION,
};
use futures_util::{FutureExt, future::LocalBoxFuture};

use crate::{models::reponse::Response, utils::jwt_utils::JwtUtils};

pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;

    type Error = Error;

    type Transform = AuthMiddlewareService<S>;

    type InitError = ();

    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService { service }))
    }
}

pub struct AuthMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
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
        log::info!("Auth middleware");
        // get access token from header
        let access_token = req
            .headers()
            .get(AUTHORIZATION)
            .and_then(|header_value| header_value.to_str().ok())
            .map(|s| s.trim_start_matches("Bearer "));

        // verify access token
        if let Some(token) = access_token {
            match JwtUtils::verify_access_token(token) {
                Ok(result) => {
                    log::info!("Access token verified");

                    // insert claims into request extension
                    req.extensions_mut().insert(result);

                    // continue to next service
                    let fut = self.service.call(req);

                    return Box::pin(async move {
                        let res = fut.await?;
                        Ok(res.map_into_left_body())
                    });
                }
                Err(e) => {
                    log::error!("Token verify failed: {e}");
                }
            };
        }

        // return unauthorized
        let http_res = HttpResponse::Unauthorized().json(Response {
            r#type: "error".to_string(),
            message: "Unauthorized".to_string(),
        });

        let (http_req, _) = req.into_parts();
        let res = ServiceResponse::new(http_req, http_res);

        return (async move { Ok(res.map_into_right_body()) }).boxed_local();
    }
}
