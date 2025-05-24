#!/usr/bin/env pwsh

# Farmera Microservices Development Startup Script
# This script starts all services in development mode

Write-Host "🌾 Starting Farmera Microservices Platform" -ForegroundColor Green
Write-Host "=" * 50

# Check if Docker is running
Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start infrastructure services
Write-Host "`n🏗️  Starting infrastructure services..." -ForegroundColor Yellow
docker-compose up -d postgres redis kafka

# Wait for services to be ready
Write-Host "⏳ Waiting for infrastructure to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if infrastructure is ready
Write-Host "🔍 Checking infrastructure health..." -ForegroundColor Yellow
node tools/health-check.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Infrastructure not ready. Please check Docker logs." -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Infrastructure is ready! Starting microservices..." -ForegroundColor Green

# Start all microservices
Write-Host "`n📡 Starting microservices..." -ForegroundColor Yellow
Write-Host "You can now start each service in separate terminals:" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Users Service (Node.js/NestJS)" -ForegroundColor White
Write-Host "cd services/users-service && npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "# Products Service (Node.js/NestJS)" -ForegroundColor White  
Write-Host "cd services/products-service && npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "# Payment Service (Node.js/NestJS)" -ForegroundColor White
Write-Host "cd services/payment-service && npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "# Notification Service (Rust/Actix-web)" -ForegroundColor White
Write-Host "cd services/notification-service && cargo run" -ForegroundColor Gray
Write-Host ""
Write-Host "# Communication Service (Rust/Actix-web)" -ForegroundColor White
Write-Host "cd services/communication-service && cargo run" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 Or use the monorepo command to start all at once:" -ForegroundColor Cyan
Write-Host "npm run start:all" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Service URLs:" -ForegroundColor Yellow
Write-Host "• Users Service:         http://localhost:3001" -ForegroundColor White
Write-Host "• Products Service:      http://localhost:3002" -ForegroundColor White
Write-Host "• Payment Service:       http://localhost:3003" -ForegroundColor White
Write-Host "• Notification Service:  http://localhost:3004" -ForegroundColor White
Write-Host "• Communication Service: http://localhost:3005" -ForegroundColor White
Write-Host ""

Write-Host "🔗 gRPC Endpoints:" -ForegroundColor Yellow
Write-Host "• Users gRPC:         localhost:50051" -ForegroundColor White
Write-Host "• Products gRPC:      localhost:50052" -ForegroundColor White
Write-Host "• Payment gRPC:       localhost:50053" -ForegroundColor White
Write-Host "• Notification gRPC:  localhost:50054" -ForegroundColor White
Write-Host "• Communication gRPC: localhost:50055" -ForegroundColor White
Write-Host ""

Write-Host "🛠️  Management UIs:" -ForegroundColor Yellow
Write-Host "• pgAdmin:        http://localhost:5050" -ForegroundColor White
Write-Host "• Redis Commander: http://localhost:8081" -ForegroundColor White
Write-Host "• Kafka UI:       http://localhost:8082" -ForegroundColor White
Write-Host ""

Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host "Run 'npm run health:check' to verify all services are running." -ForegroundColor Cyan 