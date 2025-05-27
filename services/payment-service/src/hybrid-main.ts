import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const grpcApp = app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'farmera.payment',
            protoPath: join(__dirname, '../../../shared/grpc-protos/payment/payment.proto'),
            url: 'localhost:50053',
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
        },
    });

    await app.startAllMicroservices();
    await app.listen(3003);
    console.log('🚀 Products Service is running in hybrid mode:');
    console.log('📡 REST API: http://localhost:3003');
    console.log('📡 gRPC API: grpc://localhost:50053');
}
bootstrap().catch((error) => {
    console.error('❌ Failed to start Products Service:', error);
    process.exit(1);
});