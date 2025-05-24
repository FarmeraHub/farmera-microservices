import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { VerificationModule } from '../verification/verification.module';
import { UsersGrpcController } from './users-grpc.controller';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    VerificationModule,
    ClientsModule.register([
      {
        name: 'USERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'farmera.users',
          protoPath: join(__dirname, '../../../grpc-protos/users/users.proto'),
          url: 'localhost:50051',
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            includeDirs: [join(__dirname, '../../../grpc-protos')],
          },
        },
      },
    ]),
  ],
  controllers: [UsersGrpcController],
})
export class GrpcModule {}
