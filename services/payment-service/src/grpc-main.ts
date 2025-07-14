import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { join } from "path";

async function bootstrap() {

    const grpcPort = process.env.GRPC_PORT || '50053';
    const grpcUrl = `0.0.0.0:${grpcPort}`;

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        AppModule,
        {
            transport: Transport.GRPC,
            options: {
                package: 'farmera.payment',
                protoPath: '../../../shared/grpc-protos/payment/payment.proto',
                url: 'grpcUrl',
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
    console.log('✅ Payment gRPC Service is running on localhost:50053');

}
bootstrap().catch((error) => {
    console.error('❌ Failed to start Payment gRPC Service:', error);
    process.exit(1);
});