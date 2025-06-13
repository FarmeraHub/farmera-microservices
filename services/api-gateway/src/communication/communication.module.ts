import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationController } from './conversation/conversation.controller';
import { ConversationService } from './conversation/conversation.service';
import { CommunicationGateway } from './communication.gateway';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: "COMMUNICATION_PACKAGE",
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: "farmera.communication",
            protoPath: join(__dirname, '../../../../shared/grpc-protos/communication/communication.proto',
            ),
            url: configService.get<string>('COMMUNICATION_GRPC_URL', 'localhost:50055'),
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
  controllers: [ConversationController,],
  providers: [ConversationService, CommunicationGateway,]
})
export class CommunicationModule { }
