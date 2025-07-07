import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { GrpcModule } from './grpc/grpc.module';

// Create a special module for gRPC that doesn't use the global AuthGuard
@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 20,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
        synchronize: configService.get<boolean>('DB_SYNC'),
        ssl: configService.get<boolean>('DB_SSL', true),
      }),
    }),
    AuthModule,
    UsersModule,
    EmailModule,
    VerificationModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, 'src/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    GrpcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class GrpcAppModule { }

async function bootstrap() {
  const logger = new Logger('GrpcMain');
  logger.log('Starting Users gRPC Service...');

  const grpcPort = process.env.GRPC_PORT || '50051';
  const grpcUrl = `0.0.0.0:${grpcPort}`;

  // Create the gRPC microservice using GrpcAppModule instead of AppModule
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GrpcAppModule, // Use the special gRPC module without the global AuthGuard
    {
      transport: Transport.GRPC,
      options: {
        package: 'farmera.users',
        protoPath: join(
          __dirname,
          '../../../shared/grpc-protos/users/users.proto',
        ),
        url: grpcUrl,
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
          includeDirs: [join(__dirname, '../../../shared/grpc-protos')],
        },
      },
    },
  );

  // Start the gRPC server
  await app.listen();
  logger.log(`✅ Users gRPC Service is running on ${grpcUrl}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('GrpcMain');
  logger.error('❌ Failed to start Users gRPC Service:', error);
  process.exit(1);
});
