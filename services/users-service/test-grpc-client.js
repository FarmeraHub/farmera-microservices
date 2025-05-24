const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load the proto file
const PROTO_PATH = path.join(__dirname, '../grpc-protos/users/users.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.join(__dirname, '../grpc-protos')],
});

const usersProto = grpc.loadPackageDefinition(packageDefinition).farmera.users;

// Create a client
const client = new usersProto.UsersService(
  'localhost:50051',
  grpc.credentials.createInsecure(),
);

// Test function to check if gRPC service is responding
function testConnection() {
  console.log('🧪 Testing gRPC Users Service connection...');

  // Test GetUserStats (this should work without authentication)
  const testRequest = {
    date_range: null,
    role_filter: null,
  };

  client.GetUserStats(testRequest, (error, response) => {
    if (error) {
      console.error('❌ gRPC Error:', error.message);
      console.error('   Details:', error.details);
      return;
    }

    console.log('✅ gRPC Users Service is working!');
    console.log('📊 User Stats Response:', JSON.stringify(response, null, 2));
  });
}

// Test specific user operations
function testUserOperations() {
  console.log('\n🧪 Testing user operations...');

  // Test CreateUser (this will likely fail due to verification, but shows the service is responding)
  const createUserRequest = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    role: 'BUYER',
    send_verification_email: false,
  };

  client.CreateUser(createUserRequest, (error, response) => {
    if (error) {
      console.log(
        '⚠️  CreateUser (expected error due to verification):',
        error.message,
      );
    } else {
      console.log('✅ CreateUser Response:', JSON.stringify(response, null, 2));
    }

    // Close the client
    client.close();
    console.log('\n🏁 gRPC test completed!');
  });
}

// Run tests
console.log('🚀 Starting gRPC Users Service Tests\n');
testConnection();

// Wait a bit then test user operations
setTimeout(testUserOperations, 2000);
