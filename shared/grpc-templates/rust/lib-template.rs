//! Generated gRPC code for Farmera microservices
//!
//! This crate contains all the generated protobuf and gRPC code
//! for the Farmera microservices ecosystem.

pub mod common {
    include!("farmera.common.rs");
}

pub mod users {
    include!("farmera.users.rs");
}

pub mod products {
    include!("farmera.products.rs");
}

pub mod payment {
    include!("farmera.payment.rs");
}

pub mod notification {
    include!("farmera.notification.rs");
    include!("farmera.notification.tonic.rs");
}

pub mod communication {
    include!("farmera.communication.rs");
    include!("farmera.communication.tonic.rs");
}

pub mod hello {
    include!("hello.rs");
    include!("hello.tonic.rs");
}

// Re-export commonly used types
pub use common::*;
