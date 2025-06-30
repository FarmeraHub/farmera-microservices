import { Module } from '@nestjs/common';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UserPreferencesController } from './user_preferences/user_preferences.controller';
import { UserPreferencesService } from './user_preferences/user_preferences.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: "NOTIFICATION_PACKAGE",
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: "farmera.notification",
            protoPath: join(__dirname, '../../../../shared/grpc-protos/notification/notification.proto',
            ),
            url: configService.get<string>('NOTIFICATION_GRPC_URL', 'localhost:50054'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
              includeDirs: [join(__dirname, '../../../../shared/grpc-protos')],
            },
          }
        }),
        inject: [ConfigService],
      }
    ])
  ],
  controllers: [NotificationController, UserPreferencesController],
  providers: [NotificationService, UserPreferencesService]
})
export class NotificationModule { }
