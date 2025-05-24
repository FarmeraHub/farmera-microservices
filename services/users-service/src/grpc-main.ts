import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the gRPC microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'farmera.users',
        protoPath: join(__dirname, '../../grpc-protos/users/users.proto'),
        url: 'localhost:50051',
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
          includeDirs: [join(__dirname, '../../grpc-protos')],
        },
      },
    },
  );

  // Start the gRPC server
  await app.listen();
  console.log('✅ Users gRPC Service is running on localhost:50051');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Users gRPC Service:', error);
  process.exit(1);
});
