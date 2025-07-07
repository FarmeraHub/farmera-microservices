import { Controller, Post, Body } from "@nestjs/common";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { PayosWebhookDto } from "./dto/payos-webhook.dto";
import { PaymentClientService } from "../payment.client.service";
import { Public } from "src/common/decorators/public.decorator";

@Controller("payos")
@SkipTransform()
export class PayosController {
    constructor(
        private readonly paymentClientService: PaymentClientService,
    ) { }
    @Public()
    @Post('payment')
    @ApiOperation({ summary: 'Handle Payos payment webhook' })
    async handlePaymentWebhook(
        @Body() body: PayosWebhookDto,
    ): Promise<boolean> {

        const result = await this.paymentClientService.handlePaymentCallback(body);
        console.log('Payos payment webhook handled successfully:', result);
        return result;
    }

}