const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

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

// Test ForgotPassword
console.log('🧪 Testing ForgotPassword');
client.ForgotPassword({ email: 'ntanh.fit@gmail.com' }, (error, response) => {
  if (error) {
    console.error('❌ ForgotPassword failed:', error.message);
  } else {
    console.log(
      '✅ ForgotPassword success:',
      JSON.stringify(response, null, 2),
    );
  }

  client.close();
});
