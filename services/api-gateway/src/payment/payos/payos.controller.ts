import { Controller, Post, Body, Get, Logger } from "@nestjs/common";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { PayosWebhookDto } from "./dto/payos-webhook.dto";
import { PaymentClientService } from "../payment.client.service";
import { Public } from "src/common/decorators/public.decorator";
import { SkipTransform } from "src/common/decorators/skip.decorator";


@Controller("payos")
@SkipTransform()
export class PayosController {
    private readonly logger = new Logger(PayosController.name);
    
    constructor(
        private readonly paymentClientService: PaymentClientService,
    ) { }
    @Public()
    @Post('payment')
    @ApiOperation({ summary: 'Handle Payos payment webhook' })
    async handlePaymentWebhook(
        @Body() body: PayosWebhookDto,
    ): Promise<any> {

        const result = await this.paymentClientService.handlePaymentCallback(body);
        console.log('Payos payment webhook handled successfully:', result);
        return { success: result };
    }

    // @Public()
    // @Get('test')
    // async test(): Promise<any> {

    //     const testData = {
    //         "code": "00",
    //         "desc": "success",
    //         "success": true,
    //         "data": {
    //             "accountNumber": "20976461",
    //             "amount": 30000,
    //             "description": "CSLMAIEPDI3 Thanh toan tu Farmera",
    //             "reference": "2503",
    //             "transactionDateTime": "2025-07-08 00:54:50",
    //             "virtualAccountNumber": "LOCCASS000332038",
    //             "counterAccountBankId": "",
    //             "counterAccountBankName": "TMCP Ngoai Thuong Viet Nam",
    //             "counterAccountName": "BUI TIEN DUNG198 Tran Quang Khai, Ha Noi",
    //             "counterAccountNumber": "1017712067",
    //             "virtualAccountName": "BUI TIEN DUNG",
    //             "currency": "VND",
    //             "orderCode": 107,
    //             "paymentLinkId": "ca3bce2adc024690b47f3ea2d83ba272",
    //             "code": "00",
    //             "desc": "success",
    //         },
    //         "signature": "4a3038719d98b73515567b51542a757d39a446872629f2e4a3a519517b0d2805"
    //     };
    //     const sortObjDataByKey = (object: Record<string, any>): Record<string, any> => {
    //         const orderedObject = Object.keys(object)
    //             .sort()
    //             .reduce((obj, key) => {
    //                 obj[key] = object[key];
    //                 return obj;
    //             }, {});
    //         return orderedObject;
    //     };

    //     const convertObjToQueryStr = (object: Record<string, any>): string => {
    //         return Object.keys(object)
    //             .filter((key) => object[key] !== undefined)
    //             .map((key) => {
    //                 let value = object[key];

    //                 // Sort nested object
    //                 if (value && Array.isArray(value)) {
    //                     value = JSON.stringify(value.map((val) => sortObjDataByKey(val)));
    //                 }

    //                 // Set empty string if null
    //                 if ([null, undefined, "undefined", "null"].includes(value)) {
    //                     value = "";
    //                 }

    //                 return `${key}=${value}`;
    //             })
    //             .join("&");
    //     };

     
    //     const sortedDataByKey = sortObjDataByKey(testData.data);
    //     const dataQueryStr = convertObjToQueryStr(sortedDataByKey);

    //     this.logger.debug('Sorted data:', sortedDataByKey);
    //     this.logger.debug('Query string:', dataQueryStr);

    //     const calculatedSignature = createHmac('sha256', this.checksum)
    //         .update(dataQueryStr)
    //         .digest('hex');

    //     this.logger.debug('Expected Signature:', calculatedSignature);
    //     this.logger.debug(' Received Signature:', testData.signature);

    //     const isValid = calculatedSignature === testData.signature;

    //     if (isValid) {
    //         this.logger.log('Chữ ký hợp lệ!');
    //     } else {
    //         this.logger.error('Chữ ký không hợp lệ!');
    //     }

    //     return {
    //         success: isValid,
    //         calculatedSignature,
    //         receivedSignature: testData.signature,
    //         queryString: dataQueryStr
    //     };
    // }

    
}