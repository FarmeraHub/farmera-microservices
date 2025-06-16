import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: configService.get<any>('DB_TYPE', 'postgres'),
    host: configService.get<string>('PG_HOST', 'localhost'),
    port: parseInt(configService.get<string>('PG_PORT', '5432')),
    username: configService.get<string>('PG_USER', 'postgres'),
    password: configService.get<string>('PG_PASSWORD', 'postgres'),
    database: configService.get<string>('PG_DB'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNC', true),
    logging: configService.get<boolean>('DB_LOGGING', false),
    ssl:
      configService.get<string>('NODE_ENV') === 'production'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  }),
};
