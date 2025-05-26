import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { join } from "path";

async function bootstrap() {

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.GRPC,
            options: {
                package: 'farmera.products',
                protoPath: '../../../shared/grpc-protos/products/products.proto',
                url: 'localhost:50052',
                loader: {
                    keepCase: true,
                    longs: String,
                    enums: String,
                    defaults: true,
                    oneofs: true,
                    includeDirs: [
                        join(__dirname, '../../../shared/grpc-protos/include'),
                        join(__dirname, '../../../shared/grpc-protos')
                    ],
                },
            }
        },
    );

    await app.listen();
    console.log('✅ Products gRPC Service is running on localhost:50052');

}
bootstrap().catch((error) => {
    console.error('❌ Failed to start Products gRPC Service:', error);
    process.exit(1);
});