# 🧪 gRPC Testing Guide for Users Service

This guide will walk you through testing the complete gRPC setup for the Users service.

## 🚀 Quick Start Testing

### Step 1: Start the Server

Choose one of these options:

**Option A: Hybrid Mode (Recommended)**

```bash
npm run start:hybrid:dev
```

This runs both REST (port 3002) and gRPC (port 50051) services.

**Option B: gRPC Only**

```bash
npm run start:grpc:dev
```

This runs only the gRPC service on port 50051.

### Step 2: Verify Server is Running

Look for these startup messages:

```
🚀 Users Service is running in hybrid mode:
📡 REST API: http://localhost:3002
📡 Swagger UI: http://localhost:3002/api
⚡ gRPC Service: localhost:50051
```

### Step 3: Run Comprehensive Tests

```bash
node test-grpc-complete.js
```

## 📋 Expected Test Results

### ✅ Tests That Should Pass (No Database Required)

1. **SendVerificationEmail** - Returns success message
2. **ListUsers** - Returns empty list with pagination info
3. **Logout** - Returns success response
4. **AddUserLocation** - Returns mock location data
5. **GetUsersByRole** - Returns empty list with pagination
6. **GetUserStats** - Returns zero statistics

### ⏳ Tests That Need Database Setup

- CreateUser
- Login
- GetUser
- UpdateUser
- DeleteUser
- GetUserProfile
- VerifyEmail
- UpdateUserStatus

## 🔧 Manual Testing Options

### Option 1: Using Node.js Test Client

**Basic Test:**

```bash
npm run test:grpc
```

**Comprehensive Test:**

```bash
node test-grpc-complete.js
```

### Option 2: REST API Testing (Hybrid Mode)

Visit: http://localhost:3002/api

This opens Swagger UI where you can test REST endpoints alongside gRPC.

### Option 3: Custom Test Script

Create your own test:

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto
const PROTO_PATH = path.join(__dirname, '../grpc-protos/users/users.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const usersProto = grpc.loadPackageDefinition(packageDefinition).farmera.users;
const client = new usersProto.UsersService(
  'localhost:50051',
  grpc.credentials.createInsecure(),
);

// Test any method
client.SendVerificationEmail(
  { email: 'test@example.com' },
  (error, response) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Response:', response);
    }
  },
);
```

## 🐛 Troubleshooting

### Server Not Starting

**Problem:** Server fails to start or can't bind to port
**Solutions:**

1. Check if port 50051 is already in use: `netstat -an | findstr :50051`
2. Kill any existing processes using the port
3. Try a different port in the configuration

### Proto File Not Found

**Problem:** `Error: ENOENT: no such file or directory`
**Solutions:**

1. Ensure you're in the `users-service` directory
2. Check that `../grpc-protos/users/users.proto` exists
3. Run `buf generate` from the project root if needed

### Connection Refused

**Problem:** `UNAVAILABLE: No connection could be made`
**Solutions:**

1. Make sure the server is running
2. Check the server logs for errors
3. Verify the server is listening on port 50051

### Method Not Found

**Problem:** `Unimplemented`
**Solutions:**

1. Check that the method is implemented in `users-grpc.controller.ts`
2. Verify the method name matches the proto definition
3. Restart the server after code changes

## 📊 Understanding Test Results

### Successful Test Output

```
🚀 Starting Comprehensive gRPC Users Service Tests...
═══════════════════════════════════════════════════════

🏥 Performing health check...
✅ gRPC server is ready and accepting connections

📡 Testing gRPC Methods (No Database Required)
───────────────────────────────────────────────────

🧪 Testing SendVerificationEmail...
✅ SendVerificationEmail response:
{
  "success": true,
  "message": "Verification email sent"
}
✅ Test passed

🧪 Testing ListUsers...
✅ ListUsers response:
{
  "users": [],
  "pagination": {
    "total_items": 0,
    "total_pages": 0,
    "current_page": 1,
    "page_size": 10,
    "has_next_page": false,
    "has_previous_page": false
  }
}
✅ Test passed

📊 Test Results Summary
═══════════════════════
✅ Passed: 6/6 tests
❌ Failed: 0/6 tests

🎉 All basic gRPC methods are working correctly!
```

### Failed Test Output

```
❌ SendVerificationEmail error: 14 UNAVAILABLE: No connection could be made
   Error details: Connect Failed
❌ Test failed
```

## 🔄 Testing Workflow

### 1. Basic Connectivity Test

```bash
# Start server
npm run start:hybrid:dev

# In another terminal, test connectivity
node -e "
const grpc = require('@grpc/grpc-js');
const client = { waitForReady: grpc.Client.prototype.waitForReady };
console.log('Testing gRPC connection...');
"
```

### 2. Method-by-Method Testing

Test individual methods:

```bash
# Test a specific method
node -e "
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../grpc-protos/users/users.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const usersProto = grpc.loadPackageDefinition(packageDefinition).farmera.users;
const client = new usersProto.UsersService('localhost:50051', grpc.credentials.createInsecure());

client.ListUsers({pagination: {page: 1, limit: 5}}, (err, res) => {
  console.log(err ? 'Error: ' + err.message : 'Success: ' + JSON.stringify(res, null, 2));
});
"
```

### 3. Stress Testing

Test multiple concurrent requests:

```bash
# Run multiple test instances
for i in {1..5}; do node test-grpc-complete.js & done
wait
```

## 📈 Performance Monitoring

### Server Logs

Watch the server logs to see gRPC method calls:

```
[UsersGrpcController] gRPC SendVerificationEmail request
[UsersGrpcController] gRPC ListUsers request
[UsersGrpcController] gRPC Logout request for user: test-user-123
```

### Connection Monitoring

```bash
# Monitor active connections
netstat -an | findstr :50051

# Should show something like:
TCP    0.0.0.0:50051         0.0.0.0:0              LISTENING
TCP    127.0.0.1:50051       127.0.0.1:52794        ESTABLISHED
```

## 🎯 Next Steps After Basic Testing

1. **Set up PostgreSQL database**
2. **Configure environment variables**
3. **Test database-dependent methods**
4. **Implement authentication middleware**
5. **Add integration tests**
6. **Set up monitoring and metrics**

## 🤝 Integration Testing

### Testing with Other Services

Once other services are implemented:

```javascript
// Test service-to-service communication
const productsClient = new productsProto.ProductsService(
  'localhost:50052',
  grpc.credentials.createInsecure(),
);
const usersClient = new usersProto.UsersService(
  'localhost:50051',
  grpc.credentials.createInsecure(),
);

// Test cross-service scenario
async function testUserProductFlow() {
  // 1. Create user via gRPC
  const user = await createUser(usersClient, userData);

  // 2. User browses products via gRPC
  const products = await listProducts(productsClient, { user_id: user.id });

  // 3. User adds to cart via gRPC
  // ... etc
}
```

This comprehensive testing approach ensures your gRPC implementation is solid and ready for production use!
