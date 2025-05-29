FROM clux/muslrust:stable AS builder
WORKDIR /app

RUN apt update && \
    apt install -y g++ protobuf-compiler libprotobuf-dev && \
    ln -s $(which g++) /usr/bin/x86_64-linux-musl-g++

COPY ./services/notification-service/Cargo.toml ./services/notification-service/Cargo.toml
COPY ./services/notification-service/Cargo.lock ./services/notification-service/Cargo.lock
COPY ./shared/generated/rust/ ./shared/generated/rust/

RUN mkdir -p ./services/notification-service/src && \
    echo "fn main() {}" > ./services/notification-service/src/main.rs

# Build dependencies
WORKDIR /app/services/notification-service
RUN PROTOC_INCLUDE=/usr/include cargo build --release || true

COPY ./services/notification-service/src/ ./src/
COPY ./services/notification-service/migrations/ ./migrations/

RUN PROTOC_INCLUDE=/usr/include cargo build --release

FROM alpine

RUN apk add --no-cache libgcc

COPY --from=builder /app/services/notification-service/target/x86_64-unknown-linux-musl/release/hybrid-server /usr/local/bin
COPY --from=builder /app/services/notification-service/migrations ./migrations

ENTRYPOINT ["/usr/local/bin/hybrid-server"]
