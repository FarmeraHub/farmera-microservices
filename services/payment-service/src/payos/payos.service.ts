import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from 'crypto';
import { ResponseOrderPayOSDto } from "./dto/response-order-payos.dto";
import { firstValueFrom, map } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { PayosWebhookDto } from "./dto/payos-webhook.dto";

@Injectable()
export class PayOSService {
    private readonly logger = new Logger(PayOSService.name);
    private readonly checksumKey: string;
    private readonly payOSCreateOrderUrl: string;
    private readonly webHookReturnUrl: string;
    private readonly webHookCancelUrl: string;
    private readonly payOsClientId: string;
    private readonly payOsApiKey: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {

        const PAYOS_CREATE_ORDER_URL = this.configService.get<string>('PAYOS_CREATE_ORDER_URL');
        const PAYOS_API_KEY = this.configService.get<string>('PAYOS_API_KEY');
        const PAYOS_CHECKSUM = this.configService.get<string>('PAYOS_CHECKSUM');
        const PAYOS_CLIENT_ID = this.configService.get<string>('PAYOS_CLIENT_ID');
        const WEB_HOOK_RETURN_URL = this.configService.get<string>('WEB_HOOK_RETURN_URL');
        const WEB_HOOK_CANCEL_URL = this.configService.get<string>('WEB_HOOK_CANCEL_URL');
        // Initialize any dependencies or services here if needed
        if (!PAYOS_CREATE_ORDER_URL || !PAYOS_API_KEY || !PAYOS_CHECKSUM || !PAYOS_CLIENT_ID || !WEB_HOOK_RETURN_URL || !WEB_HOOK_CANCEL_URL) {
            throw new Error('Missing required environment variables for PayOS configuration');
        }
        this.payOSCreateOrderUrl = PAYOS_CREATE_ORDER_URL;
        this.payOsApiKey = PAYOS_API_KEY;
        this.checksumKey = PAYOS_CHECKSUM;
        this.payOsClientId = PAYOS_CLIENT_ID;
        this.webHookReturnUrl = WEB_HOOK_RETURN_URL;
        this.webHookCancelUrl = WEB_HOOK_CANCEL_URL;
    }

    async calculatePayOSSignature(
        amount: number,
        description: string,
        orderCode: number,
    ): Promise<string> {
        // Ghép data string theo thứ tự alphabet
        const dataString = `amount=${amount}&cancelUrl=${this.webHookCancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${this.webHookReturnUrl}`;
        this.logger.debug('Data string để ký:', dataString);

        // Tính HMAC-SHA256 với checksum key
        const signature = crypto
            .createHmac('sha256', this.checksumKey)
            .update(dataString)
            .digest('hex');

        return signature;
    }

    async createPayOSOrder(
        amount: number,
        description: string,
        orderCode: number,
    ): Promise<ResponseOrderPayOSDto> {
        const signature = await this.calculatePayOSSignature(amount, description, orderCode);
        const headers = {
            'Content-Type': 'application/json',
            'x-client-Id': this.payOsClientId,
            'x-api-key': this.payOsApiKey,
        }
        const body = {
            amount: amount,
            description: description,
            orderCode: orderCode,
            returnUrl: this.webHookReturnUrl,
            cancelUrl: this.webHookCancelUrl,
            signature: signature,
        };
        this.logger.debug('Headers:', headers);
        this.logger.debug('Body:', body);
        try {

            const response = await firstValueFrom(
                this.httpService.post<ResponseOrderPayOSDto>(
                    this.payOSCreateOrderUrl,
                    body,
                    { headers }
                ).pipe(
                    map(axiosResponse => {
                        const responseData = axiosResponse.data;
                        if (responseData.code === '00') {
                            return responseData;
                        }
                        else {
                            this.logger.error(`Lỗi khi tạo đơn hàng PayOS: ${responseData.desc}`);
                            throw new Error(`PayOS error: ${responseData.desc}`);
                        }
                    })
                )
            );

            // ✅ Return the response
            return response;
        }
        catch (error) {
            this.logger.error('Lỗi khi tạo đơn hàng PayOS:', error);
            throw new Error('Không thể tạo đơn hàng PayOS');
        }
    }

    async verifySignature(webhook: PayosWebhookDto): Promise<boolean> {
        if (!webhook || !webhook.data || !webhook.signature) {
            this.logger.warn('Missing required fields to verify signature');
            return false;
        }
        if (!webhook.data.virtualAccountNumber) {
            webhook.data.virtualAccountNumber = "";
        }
        if (!webhook.data.virtualAccountName) {
            webhook.data.virtualAccountName = "";
        }
        if (!webhook.data.counterAccountBankId) {
            webhook.data.counterAccountBankId = "";
        }
        if (!webhook.data.counterAccountBankName) {
            webhook.data.counterAccountBankName = "";
        }
        if (!webhook.data.counterAccountName) {
            webhook.data.counterAccountName = "";
        }
        if (!webhook.data.counterAccountNumber) {
            webhook.data.counterAccountNumber = "";
        }
        this.logger.debug(' Verifying webhook signature:', webhook);

      
        const sortedDataByKey = this.sortObjDataByKey(webhook.data);
        const dataQueryStr = this.convertObjToQueryStr(sortedDataByKey);

        this.logger.debug('Sorted data:', sortedDataByKey);
        this.logger.debug('Query string:', dataQueryStr);

        const calculatedSignature = crypto.createHmac('sha256', this.checksumKey)
            .update(dataQueryStr)
            .digest('hex');

        this.logger.debug('Expected Signature:', calculatedSignature);
        this.logger.debug('Received Signature:', webhook.signature);

        return calculatedSignature === webhook.signature;
    }

    private sortObjDataByKey(object: Record<string, any>): Record<string, any> {
        const orderedObject = Object.keys(object)
            .sort()
            .reduce((obj, key) => {
                obj[key] = object[key];
                return obj;
            }, {});
        return orderedObject;
    }

    private convertObjToQueryStr(object: Record<string, any>): string {
        return Object.keys(object)
            .filter((key) => object[key] !== undefined)
            .map((key) => {
                let value = object[key];

                // Sort nested object
                if (value && Array.isArray(value)) {
                    value = JSON.stringify(value.map((val) => this.sortObjDataByKey(val)));
                }

                // Set empty string if null
                if ([null, undefined, "undefined", "null"].includes(value)) {
                    value = "";
                }

                return `${key}=${value}`;
            })
            .join("&");
    }

}