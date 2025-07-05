export class ResponseOrderPayOSDto {
    code: string;
    desc: string;
    data: ResponseOrderPayOSDataDto;
    signature: string;

}
export class ResponseOrderPayOSDataDto {
    bin: string;
    accountNumber: string;
    accoutName: string;
    amount: number;
    description: string;
    orderCode: string;
    curency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
}