import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Create the main HTTP application
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Farmera Users Service')
    .setDescription('REST API and gRPC endpoints for user management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Connect gRPC microservice
  const grpcApp = app.connectMicroservice<MicroserviceOptions>({
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
  });

  // Start both servers
  await app.startAllMicroservices();
  await app.listen(3002);

  console.log('🚀 Users Service is running in hybrid mode:');
  console.log('📡 REST API: http://localhost:3002');
  console.log('📡 Swagger UI: http://localhost:3002/api');
  console.log('⚡ gRPC Service: localhost:50051');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Users Service:', error);
  process.exit(1);
});
