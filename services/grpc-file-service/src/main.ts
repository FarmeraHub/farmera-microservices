import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const grpc = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'farmera.files',
      protoPath: join(__dirname, '../../../shared/grpc-protos/files/files.proto'),
      url: 'localhost:50056',
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);

}
bootstrap();
