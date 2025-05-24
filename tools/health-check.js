#!/usr/bin/env node

const http = require("http");
const https = require("https");

const services = [
  { name: "Users Service", url: "http://localhost:3001/health", type: "http" },
  {
    name: "Products Service",
    url: "http://localhost:3002/health",
    type: "http",
  },
  {
    name: "Payment Service",
    url: "http://localhost:3003/health",
    type: "http",
  },
  {
    name: "Notification Service",
    url: "http://localhost:3004/health",
    type: "http",
  },
  {
    name: "Communication Service",
    url: "http://localhost:3005/health",
    type: "http",
  },
  { name: "PostgreSQL", url: "localhost:5432", type: "tcp" },
  { name: "Redis", url: "localhost:6379", type: "tcp" },
  { name: "Kafka", url: "localhost:9092", type: "tcp" },
];

const grpcServices = [
  { name: "Users gRPC", port: 50051 },
  { name: "Products gRPC", port: 50052 },
  { name: "Payment gRPC", port: 50053 },
  { name: "Notification gRPC", port: 50054 },
  { name: "Communication gRPC", port: 50055 },
];

function checkHttpService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "GET",
        timeout: 5000,
      },
      (res) => {
        resolve({
          name: service.name,
          status:
            res.statusCode === 200
              ? "✅ Healthy"
              : `❌ Unhealthy (${res.statusCode})`,
          url: service.url,
        });
      }
    );

    req.on("error", () => {
      resolve({
        name: service.name,
        status: "❌ Unreachable",
        url: service.url,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        name: service.name,
        status: "❌ Timeout",
        url: service.url,
      });
    });

    req.end();
  });
}

function checkTcpService(service) {
  return new Promise((resolve) => {
    const net = require("net");
    const [host, port] = service.url.split(":");

    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(parseInt(port), host, () => {
      socket.destroy();
      resolve({
        name: service.name,
        status: "✅ Connected",
        url: service.url,
      });
    });

    socket.on("error", () => {
      resolve({
        name: service.name,
        status: "❌ Connection Failed",
        url: service.url,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        name: service.name,
        status: "❌ Timeout",
        url: service.url,
      });
    });
  });
}

function checkGrpcService(service) {
  return new Promise((resolve) => {
    const net = require("net");

    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(service.port, "localhost", () => {
      socket.destroy();
      resolve({
        name: service.name,
        status: "✅ Connected",
        url: `localhost:${service.port}`,
      });
    });

    socket.on("error", () => {
      resolve({
        name: service.name,
        status: "❌ Connection Failed",
        url: `localhost:${service.port}`,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        name: service.name,
        status: "❌ Timeout",
        url: `localhost:${service.port}`,
      });
    });
  });
}

async function checkAllServices() {
  console.log("🔍 Farmera Microservices Health Check\n");
  console.log("=".repeat(60));

  // Check HTTP services
  console.log("\n📡 HTTP Services:");
  console.log("-".repeat(40));
  const httpChecks = services
    .filter((s) => s.type === "http")
    .map(checkHttpService);

  const httpResults = await Promise.all(httpChecks);
  httpResults.forEach((result) => {
    console.log(`${result.status.padEnd(20)} ${result.name} (${result.url})`);
  });

  // Check TCP services (Infrastructure)
  console.log("\n🏗️  Infrastructure Services:");
  console.log("-".repeat(40));
  const tcpChecks = services
    .filter((s) => s.type === "tcp")
    .map(checkTcpService);

  const tcpResults = await Promise.all(tcpChecks);
  tcpResults.forEach((result) => {
    console.log(`${result.status.padEnd(20)} ${result.name} (${result.url})`);
  });

  // Check gRPC services
  console.log("\n🔗 gRPC Services:");
  console.log("-".repeat(40));
  const grpcChecks = grpcServices.map(checkGrpcService);

  const grpcResults = await Promise.all(grpcChecks);
  grpcResults.forEach((result) => {
    console.log(`${result.status.padEnd(20)} ${result.name} (${result.url})`);
  });

  // Summary
  const allResults = [...httpResults, ...tcpResults, ...grpcResults];
  const healthy = allResults.filter((r) => r.status.includes("✅")).length;
  const total = allResults.length;

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Summary: ${healthy}/${total} services healthy`);

  if (healthy === total) {
    console.log("🎉 All services are running correctly!");
    process.exit(0);
  } else {
    console.log("⚠️  Some services are not responding. Check the logs above.");
    process.exit(1);
  }
}

// Run the health check
checkAllServices().catch((error) => {
  console.error("❌ Health check failed:", error.message);
  process.exit(1);
});
