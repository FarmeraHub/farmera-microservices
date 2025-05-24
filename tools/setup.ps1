# Farmera Microservices gRPC Setup Script for Windows
# This script sets up the development environment for gRPC services

Write-Host "🌾 Farmera Microservices gRPC Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required tools are installed
function Test-Dependencies {
    Write-Status "Checking dependencies..."
    
    # Check for buf
    try {
        buf --version | Out-Null
        Write-Success "buf CLI found"
    }
    catch {
        Write-Error "buf is not installed. Please install it from https://buf.build/docs/installation"
        exit 1
    }
    
    # Check for protoc
    try {
        protoc --version | Out-Null
        Write-Success "protoc found"
    }
    catch {
        Write-Error "protoc is not installed. Please install it using: winget install protobuf"
        exit 1
    }
    
    # Check for Node.js
    try {
        node --version | Out-Null
        Write-Success "Node.js found"
    }
    catch {
        Write-Warning "Node.js is not installed. Please install it from https://nodejs.org/"
    }
    
    # Check for Rust
    try {
        cargo --version | Out-Null
        Write-Success "Rust found"
    }
    catch {
        Write-Warning "Rust is not installed. Please install it from https://rustup.rs/"
    }
    
    Write-Success "Dependencies check completed"
}

# Create Buf generation templates
function New-BufTemplates {
    Write-Status "Creating Buf generation templates..."
    
    # Node.js template
    @"
version: v1
plugins:
  - plugin: buf.build/protocolbuffers/js:v3.21.2
    out: ../generated/nodejs
    opt: import_style=commonjs
  - plugin: buf.build/grpc/node:v1.8.14
    out: ../generated/nodejs
    opt: grpc_js
  - plugin: buf.build/protocolbuffers/ts:v4.5.0
    out: ../generated/nodejs
    opt: 
      - generate_dependencies=false
      - long_type_string=false
      - enum_type=string_literal
"@ | Out-File -FilePath "buf.gen.nodejs.yaml" -Encoding UTF8
    
    # Rust template
    @"
version: v1
plugins:
  - plugin: buf.build/community/neoeinstein-prost:v0.12.1
    out: ../generated/rust/src
    opt:
      - bytes=.
      - file_descriptor_set
  - plugin: buf.build/community/neoeinstein-prost-serde:v0.12.1
    out: ../generated/rust/src
  - plugin: buf.build/community/neoeinstein-tonic:v0.10.0
    out: ../generated/rust/src
    opt:
      - no_include
      - compile_well_known_types
"@ | Out-File -FilePath "buf.gen.rust.yaml" -Encoding UTF8
    
    Write-Success "Buf templates created"
}

# Validate proto files
function Test-Protos {
    Write-Status "Validating proto files..."
    
    # Lint proto files
    buf lint
    
    # Check for breaking changes (if previous version exists)
    if (Test-Path ".git") {
        try {
            buf breaking --against '.git#branch=main'
        }
        catch {
            Write-Warning "Could not check for breaking changes (no main branch or first run)"
        }
    }
    
    Write-Success "Proto files validated"
}

# Generate gRPC code for Node.js services
function New-NodejsCode {
    Write-Status "Generating gRPC code for Node.js services..."
    
    # Create output directories
    New-Item -ItemType Directory -Force -Path "../generated/nodejs/common" | Out-Null
    New-Item -ItemType Directory -Force -Path "../generated/nodejs/users" | Out-Null
    New-Item -ItemType Directory -Force -Path "../generated/nodejs/products" | Out-Null
    New-Item -ItemType Directory -Force -Path "../generated/nodejs/payment" | Out-Null
    New-Item -ItemType Directory -Force -Path "../generated/nodejs/notification" | Out-Null
    New-Item -ItemType Directory -Force -Path "../generated/nodejs/communication" | Out-Null
    
    # Generate using buf
    buf generate --template buf.gen.nodejs.yaml
    
    Write-Success "Node.js gRPC code generated"
}

# Generate gRPC code for Rust services
function New-RustCode {
    Write-Status "Generating gRPC code for Rust services..."
    
    # Create output directories
    New-Item -ItemType Directory -Force -Path "../generated/rust/src" | Out-Null
    
    # Generate using buf
    buf generate --template buf.gen.rust.yaml
    
    Write-Success "Rust gRPC code generated"
}

# Install Node.js dependencies for generated code
function Install-NodejsDeps {
    Write-Status "Setting up Node.js dependencies..."
    
    # Create package.json for generated code
    @"
{
  "name": "@farmera/grpc-client",
  "version": "1.0.0",
  "description": "Generated gRPC client code for Farmera microservices",
  "main": "index.js",
  "types": "index.d.ts",
  "dependencies": {
    "@grpc/grpc-js": "^1.9.0",
    "@grpc/proto-loader": "^0.7.8",
    "google-protobuf": "^3.21.0"
  },
  "devDependencies": {
    "@types/google-protobuf": "^3.15.0",
    "typescript": "^5.0.0"
  }
}
"@ | Out-File -FilePath "../generated/nodejs/package.json" -Encoding UTF8
    
    # Install dependencies
    $originalLocation = Get-Location
    Set-Location "../generated/nodejs"
    
    try {
        npm install
        Write-Success "Node.js dependencies installed"
    }
    catch {
        Write-Warning "Failed to install Node.js dependencies. Make sure npm is installed."
    }
    finally {
        Set-Location $originalLocation
    }
}

# Setup Rust dependencies for generated code
function Install-RustDeps {
    Write-Status "Setting up Rust dependencies..."
    
    # Create Cargo.toml for generated code
    @"
[package]
name = "farmera-grpc-proto"
version = "0.1.0"
edition = "2021"

[dependencies]
tonic = "0.10"
prost = "0.12"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["macros", "rt-multi-thread"] }

[build-dependencies]
tonic-build = "0.10"
"@ | Out-File -FilePath "../generated/rust/Cargo.toml" -Encoding UTF8
    
    # Create lib.rs
    @"
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
}

pub mod communication {
    include!("farmera.communication.rs");
}

// Re-export commonly used types
pub use common::*;
"@ | Out-File -FilePath "../generated/rust/src/lib.rs" -Encoding UTF8
    
    Write-Success "Rust dependencies setup"
}

# Create development scripts
function New-DevScripts {
    Write-Status "Creating development scripts..."
    
    # Create regenerate script
    @"
# Regenerate gRPC code
Write-Host "🔄 Regenerating gRPC code..." -ForegroundColor Blue
buf generate --template buf.gen.nodejs.yaml
buf generate --template buf.gen.rust.yaml
Write-Host "✅ Code regeneration completed" -ForegroundColor Green
"@ | Out-File -FilePath "regenerate.ps1" -Encoding UTF8
    
    Write-Success "Development scripts created"
}

# Main execution
function Main {
    param($Args)
    
    Write-Status "Starting Farmera gRPC setup..."
    
    # Run setup steps
    Test-Dependencies
    New-BufTemplates
    Test-Protos
    New-NodejsCode
    New-RustCode
    Install-NodejsDeps
    Install-RustDeps
    New-DevScripts
    
    Write-Success "🎉 Farmera gRPC setup completed successfully!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run '.\regenerate.ps1' to regenerate code after proto changes" -ForegroundColor White
    Write-Host "2. Check the generated code in '../generated/' directory" -ForegroundColor White
    Write-Host "3. Start implementing your gRPC services!" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation: See README.md for detailed implementation guide" -ForegroundColor Yellow
}

# Run main function
Main $args 