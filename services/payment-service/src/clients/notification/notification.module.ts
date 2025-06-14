import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NotificationService } from './notification.service';

@Module({
    imports: [
        ConfigModule,
        ClientsModule.registerAsync([{
            name: "NOTIFICATION",
            useFactory: async (configService: ConfigService) => ({
                transport: Transport.GRPC,
                options: {
                    package: "farmera.notification",
                    protoPath: join(__dirname, '../../../../../shared/grpc-protos/notification/notification.proto'),
                    url: configService.get<string>('NOTIFICATION_GRPC_URL', 'localhost:50054'),
                    loader: {
                        keepCase: true,
                        longs: String,
                        enums: String,
                        defaults: true,
                        oneofs: true,
                        includeDirs: [join(__dirname, '../../../../../shared/grpc-protos')],
                    }
                }
            }),
            inject: [ConfigService]
        }])
    ],
    providers: [NotificationService]
})
export class NotificationModule { }
