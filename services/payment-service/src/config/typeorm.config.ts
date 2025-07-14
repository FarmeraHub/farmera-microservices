import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        type: configService.get<any>('DB_TYPE'),
        host: configService.get<string>('PG_HOST'),
        port: parseInt(configService.get<string>('PG_PORT') || '5432'),
        username: configService.get<string>('PG_USER'),
        password: configService.get<string>('PG_PASSWORD'),
        database: configService.get<string>('PG_DB'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNC', true),
        logging: configService.get<boolean>('DB_LOGGING', false),
        ssl:
            configService.get<string>('DB_SSL') === 'true'
                ? {
                    require: true,
                    rejectUnauthorized: false,
                }
                : false,
    })
}