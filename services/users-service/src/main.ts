import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { xss } from 'express-xss-sanitizer';
import helmet from 'helmet';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AuthGuard } from './auth/auth.guard';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';
import { SanitizeInterceptor } from './interceptors/sanitize.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);

  app.use(helmet());
  // app.use(xss());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.useGlobalGuards(new AuthGuard(jwtService, reflector));

  app.useGlobalInterceptors(
    new SanitizeInterceptor(),
    new TransformInterceptor(reflector),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Farmera Vietnam API')
    .setDescription('API documentation for the Farmera Vietnam project')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  if (process.env.NODE_ENV !== 'production') {
    fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2));
  }

  SwaggerModule.setup('swagger', app, document);

  const port = configService.get<string>('PORT') || 8000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
bootstrap();

//trigger
