import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { HashService } from 'src/services/hash.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'USERS_GRPC_PACKAGE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'farmera.users',
            protoPath: join(
              __dirname,
              '../../../../shared/grpc-protos/users/users.proto',
            ),
            url:
              configService.get<string>('USERS_GRPC_URL') || 'localhost:50051',
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
              includeDirs: [join(__dirname, '../../../../shared/grpc-protos')],
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService, HashService],
  exports: [UserService],
})
export class UserModule {}
