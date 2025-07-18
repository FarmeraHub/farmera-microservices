import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration - allow all origins
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Farmera API Gateway')
    .setDescription('Central API Gateway for Farmera Microservices Platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Products', 'Product catalog endpoints')
    .addTag('Payments', 'Payment and order endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .addTag('Communication', 'Real-time communication endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const addr = configService.get<string>('HOST', 'http://localhost');
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  console.log(`🚀 API Gateway is running on: ${addr}:${port}`);
  console.log(`📚 API Documentation: : ${addr}:${port}/api/docs`);
}

bootstrap();
