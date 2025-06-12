import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GrpcModule } from './grpc/grpc.module';
import { GrpcClientModule } from './grpc-client/grpc-client.module';

@Module({
  imports: [GrpcModule, GrpcClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
