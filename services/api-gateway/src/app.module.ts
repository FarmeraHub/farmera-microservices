import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProxyModule } from './proxy/proxy.module';
import { GuardsModule } from './guards/guards.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProductModule } from './product/product.module';
import { CommunicationModule } from './communication/communication.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // JWT configuration
    JwtModule.registerAsync({
      global: true,
      inject: [],
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'fallback_secret',
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
        },
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [],
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
            limit: parseInt(process.env.THROTTLE_LIMIT || '10'),
          },
        ],
      }),
    }),

    // Caching
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [],
      useFactory: () => ({
        ttl: parseInt(process.env.CACHE_TTL || '300') * 1000,
      }),
    }),

    // Custom modules
    AuthModule,
    UserModule,
    GuardsModule,
    HealthModule,
    MediaModule,
    ProxyModule,
    ProductModule,
    CommunicationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
