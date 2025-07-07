import { Controller, Post, Body } from "@nestjs/common";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { PayosWebhookDto } from "./dto/payos-webhook.dto";

@Controller("payos")
export class PayosController {
  
    @Post('payment')
    @ApiOperation({ summary: 'Handle Payos payment webhook' })
    @ApiBody({ type: PayosWebhookDto })
    async handlePaymentWebhook(
         @Body() body: PayosWebhookDto,
    ) {
     
    }

}