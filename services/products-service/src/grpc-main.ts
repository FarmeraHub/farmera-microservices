import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { join } from "path";
import { Logger } from "@nestjs/common";

async function bootstrap() {

  const logger = new Logger('GrpcMain');
  logger.log('Starting Product gRPC Service...');

  const grpcPort = process.env.GRPC_PORT || '50052';
  const grpcUrl = `0.0.0.0:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'farmera.products',
        protoPath: join(__dirname, '../../../shared/grpc-protos/products/products.proto'),
        url: grpcUrl,
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
          includeDirs: [
            join(__dirname, '../../../shared/grpc-protos')
          ],
        },
      }
    },
  );

  await app.listen();
  logger.log(`✅ Products gRPC Service is running on ${grpcUrl}`);

}
bootstrap().catch((error) => {
  console.error('❌ Failed to start Products gRPC Service:', error);
  process.exit(1);
});
