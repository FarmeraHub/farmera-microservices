import { Module } from '@nestjs/common';
import { GrpcClientController } from './grpc-client.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcClientService } from './grpc-client.service';

@Module({
  controllers: [GrpcClientController],
  imports: [
    ClientsModule.register([
      {
        name: 'FILES_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'farmera.files',
          protoPath: join(__dirname, '../../../../shared/grpc-protos/files/files.proto'),
          url: 'localhost:50056',
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  providers: [GrpcClientService]
})
export class GrpcClientModule { }
