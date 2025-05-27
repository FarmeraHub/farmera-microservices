#!/bin/bash

# This script regenerates gRPC code for Farmera microservices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get absolute path of script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR/../shared/grpc-protos"

echo "Regenerating gRPC code..."
buf generate --template buf.gen.nodejs.yaml
buf generate --template buf.gen.rust.yaml
echo "Code regeneration completed"
