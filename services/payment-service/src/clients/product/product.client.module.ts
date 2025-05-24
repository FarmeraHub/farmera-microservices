import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProductClientService } from "./product.client.service";

@Module({
    imports: [
        HttpModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const apiKey = configService.get<string>('PRODUCT_SERVICE_API_KEY');
                const headers: Record<string, string> = {
                    'X-Service-Source': 'payment-service',
                    'Content-Type': 'application/json',
                };
                if (apiKey) {
                    headers['X-API-Key'] = apiKey;
                }
                return {
                    baseURL: configService.get<string>('PRODUCT_SERVICE_BASE_URL'),
                    timeout: configService.get<number>('PRODUCT_SERVICE_TIMEOUT'),
                    headers,
                };
            }
        })
    ],
    providers: [ProductClientService],
    exports: [ProductClientService],
})
export class ProductClientModule {}