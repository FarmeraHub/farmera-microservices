import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileStorageService } from './file-storage.service';
import { LocalStorageStrategy } from './local-storage.strategy';
import { IStorageStrategy, STORAGE_STRATEGY } from './storage.strategy.interface';
import { AzureBlobStorageStrategy } from './azure-blob-storage-strategy';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: STORAGE_STRATEGY,
            useFactory: (configService: ConfigService): IStorageStrategy => {
                const storageType = configService.get<string>('STORAGE_TYPE', 'azure_blob');
                if (storageType === 'azure_blob') {
                    return new AzureBlobStorageStrategy(configService);
                }
                return new LocalStorageStrategy(configService);
            },
            inject: [ConfigService],
        },
        FileStorageService,
    ],
    exports: [FileStorageService],
})
export class FileStorageModule { }