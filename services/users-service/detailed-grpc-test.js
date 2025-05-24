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
  includeDirs: [path.join(__dirname, '../grpc-protos')],
});

const usersProto = grpc.loadPackageDefinition(packageDefinition).farmera.users;
const client = new usersProto.UsersService(
  'localhost:50051',
  grpc.credentials.createInsecure(),
);

// Test 1: GetUserStats (should work)
console.log('🧪 Test 1: GetUserStats');
client.GetUserStats({}, (error, response) => {
  if (error) {
    console.error('❌ GetUserStats failed:', error.message);
  } else {
    console.log('✅ GetUserStats success:', JSON.stringify(response, null, 2));
  }

  // Test 2: SendVerificationEmail (should work)
  console.log('\n🧪 Test 2: SendVerificationEmail');
  client.SendVerificationEmail(
    { email: 'test@example.com' },
    (error, response) => {
      if (error) {
        console.error('❌ SendVerificationEmail failed:', error.message);
      } else {
        console.log(
          '✅ SendVerificationEmail success:',
          JSON.stringify(response, null, 2),
        );
      }

      // Test 3: ListUsers (should work)
      console.log('\n🧪 Test 3: ListUsers');
      client.ListUsers(
        { pagination: { page: 1, limit: 5 } },
        (error, response) => {
          if (error) {
            console.error('❌ ListUsers failed:', error.message);
          } else {
            console.log(
              '✅ ListUsers success:',
              JSON.stringify(response, null, 2),
            );
          }

          client.close();
          console.log('\n🏁 Detailed tests completed!');
        },
      );
    },
  );
});
