FROM clux/muslrust:stable AS builder
WORKDIR /app

RUN apt update && \
    apt install -y protobuf-compiler libprotobuf-dev

COPY ./services/communication-service/Cargo.toml ./services/communication-service/Cargo.toml
COPY ./services/communication-service/Cargo.lock ./services/communication-service/Cargo.lock
COPY ./shared/generated/rust/ ./shared/generated/rust/

RUN mkdir -p ./services/communication-service/src && \
    echo "fn main() {}" > ./services/communication-service/src/main.rs

WORKDIR /app/services/communication-service

RUN PROTOC_INCLUDE=/usr/include cargo build --release || true

COPY ./services/communication-service/src/ ./src/
COPY ./services/communication-service/migrations/ ./migrations/

RUN PROTOC_INCLUDE=/usr/include cargo build --release

FROM alpine:latest

COPY --from=builder /app/services/communication-service/target/x86_64-unknown-linux-musl/release/grpc-server /usr/local/bin
COPY --from=builder /app/services/communication-service/migrations ./migrations

EXPOSE 3005
EXPOSE 50055

ENTRYPOINT ["/usr/local/bin/grpc-server"]