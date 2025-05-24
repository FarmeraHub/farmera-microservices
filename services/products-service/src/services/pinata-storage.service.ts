import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinataSDK } from 'pinata';

@Injectable()
export class PinataStorageService {

    private logger = new Logger(PinataStorageService.name);
    private pinata: PinataSDK;

    constructor(private readonly configService: ConfigService) {
        this.pinata = new PinataSDK({
            pinataJwt: configService.get<string>('PINATA_JWT'),
            pinataGateway: configService.get<string>('PINATA_GATEWAY')
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        try {
            const date = new Date().getTime();
            const fileToUpload = new File([file.buffer], `${date}-${file.originalname}`, {
                type: file.mimetype
            });
            const result = await this.pinata.upload.public.file(fileToUpload);
            return result.cid;
        }
        catch (error) {
            this.logger.error('Error uploading file to Pinata', error);
            throw error;
        }
    }

    async uploadMutipleFiles(files: Express.Multer.File[]): Promise<string[]> {
        try {
            const uploadPromises = files.map(file => this.uploadFile(file));
            const cids = await Promise.all(uploadPromises);
            return cids;
        }
        catch (error) {
            this.logger.error('Error uploading multiple files to Pinata', error);
            throw error;
        }
    }

    async uploadFileArray(folderName: string, files: Express.Multer.File[]): Promise<string> {
        try {
            const date = new Date().getTime();
            const fileToUpload = files.map(file => new File([file.buffer], `${date}-${file.originalname}`, {
                type: file.mimetype
            }));
            const result = await this.pinata.upload.public.fileArray(fileToUpload).name(folderName);
            return result.cid;
        }
        catch (error) {
            this.logger.error('Error uploading files to Pinata', error);
            throw error;
        }
    }

    async uploadJson(json: any): Promise<string> {
        try {
            const result = await this.pinata.upload.public.json(json);
            return result.cid;
        }
        catch (error) {
            this.logger.error('Error uploading JSON to Pinata', error);
            throw error;
        }
    }
}
