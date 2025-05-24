const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load the proto file with proper include paths
const PROTO_PATH = path.join(__dirname, '../grpc-protos/users/users.proto');
const PROTO_ROOT = path.join(__dirname, '../grpc-protos');

console.log('🔍 Loading proto file from:', PROTO_PATH);
console.log('🔍 Proto root directory:', PROTO_ROOT);

let packageDefinition, usersProto, client;

try {
  packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_ROOT], // Add the root directory for imports
  });

  usersProto = grpc.loadPackageDefinition(packageDefinition).farmera.users;

  // Create a client
  client = new usersProto.UsersService(
    'localhost:50051',
    grpc.credentials.createInsecure(),
  );

  console.log('✅ gRPC client created successfully');
} catch (error) {
  console.error('❌ Failed to load proto or create client:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}

// Health check function
async function healthCheck() {
  console.log('\n🏥 Performing health check...');

  return new Promise((resolve) => {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);

    client.waitForReady(deadline, (error) => {
      if (error) {
        console.error('❌ gRPC server is not ready:', error.message);
        console.log(
          '💡 Make sure to start the server with: npm run start:hybrid:dev',
        );
        resolve(false);
      } else {
        console.log('✅ gRPC server is ready and accepting connections');
        resolve(true);
      }
    });
  });
}

// Test basic placeholder methods (that don't require database)
async function testSendVerificationEmail() {
  console.log('\n🧪 Testing SendVerificationEmail...');

  return new Promise((resolve, reject) => {
    client.SendVerificationEmail(
      {
        email: 'test@example.com',
      },
      (error, response) => {
        if (error) {
          console.error('❌ SendVerificationEmail error:', error.message);
          console.error('   Error details:', error.details);
          reject(error);
        } else {
          console.log('✅ SendVerificationEmail response:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        }
      },
    );
  });
}

async function testListUsers() {
  console.log('\n🧪 Testing ListUsers...');

  return new Promise((resolve, reject) => {
    client.ListUsers(
      {
        pagination: {
          page: 1,
          limit: 10,
        },
        role_filter: 1, // BUYER
      },
      (error, response) => {
        if (error) {
          console.error('❌ ListUsers error:', error.message);
          console.error('   Error details:', error.details);
          reject(error);
        } else {
          console.log('✅ ListUsers response:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        }
      },
    );
  });
}

async function testLogout() {
  console.log('\n🧪 Testing Logout...');

  return new Promise((resolve, reject) => {
    client.Logout(
      {
        user_id: 'test-user-123',
        device_id: 'test-device',
      },
      (error, response) => {
        if (error) {
          console.error('❌ Logout error:', error.message);
          console.error('   Error details:', error.details);
          reject(error);
        } else {
          console.log('✅ Logout response:');
          console.log(JSON.stringify(response, null, 2));
          resolve(response);
        }
      },
    );
  });
}

// Main test function
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive gRPC Users Service Tests...');
  console.log('═══════════════════════════════════════════════════════');

  // Step 1: Health check
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log('\n❌ Server is not running. Please start it first:');
    console.log('   npm run start:hybrid:dev');
    return;
  }

  // Step 2: Test basic methods
  console.log('\n📡 Testing gRPC Methods (No Database Required)');
  console.log('───────────────────────────────────────────────────');

  let passedTests = 0;
  let totalTests = 0;

  const tests = [testSendVerificationEmail, testListUsers, testLogout];

  for (const test of tests) {
    totalTests++;
    try {
      await test();
      passedTests++;
      console.log('✅ Test passed\n');
    } catch (error) {
      console.log('❌ Test failed\n');
    }
  }

  // Step 3: Results summary
  console.log('\n📊 Test Results Summary');
  console.log('═══════════════════════');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All basic gRPC methods are working correctly!');
    console.log('🔧 Next steps:');
    console.log('   1. Configure PostgreSQL database');
    console.log('   2. Test database-dependent methods');
    console.log('   3. Implement authentication middleware');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }

  console.log('\n📋 Database-dependent methods (require proper setup):');
  console.log('   - CreateUser (needs database and email service)');
  console.log('   - Login (needs user in database)');
  console.log('   - GetUser (needs existing user ID)');
  console.log('   - UpdateUser (needs existing user ID)');
  console.log('   💡 These can be tested once database is configured');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  healthCheck,
};
