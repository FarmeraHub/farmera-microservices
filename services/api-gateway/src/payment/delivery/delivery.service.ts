import { catchError, firstValueFrom, map } from 'rxjs';
import { PaymentServiceClient } from '@farmera/grpc-proto/dist/payment/payment';
import { HttpException, Inject, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CalculateDeliveryRequestDto } from './dto/calculate-delivery.dto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { ShippingDetail } from '../order/entities/shipping-detail.entity';
import { Issue } from '../order/entities/issue.entity';
import { IssueMapper } from 'src/mappers/payment/issue.mapper';
import { ShippingDetailMapper } from 'src/mappers/payment/shipping-detail.mapper';
import { PickShiftDto } from './dto/pickshift.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';

@Injectable()
export class DeliveryService implements OnModuleInit {
    private readonly logger = new Logger(DeliveryService.name);
    private deliveryGrpcService: PaymentServiceClient;
    private ghnToken: string;
    private ghnUrlGetPickShift: string;
    constructor(
        @Inject('PAYMENT_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        
    ) {
        const GHN_TOKEN = this.configService.get<string>('GHN_TOKEN');
        const GHN_GET_PICK_SHIFT_URL = this.configService.get<string>('GHN_GET_PICK_SHIFT_URL');
        if (!GHN_TOKEN || !GHN_GET_PICK_SHIFT_URL) {
            this.logger.error('GHN_TOKEN or GHN_GET_PICK_SHIFT_URL is not defined in the environment variables');
            throw new Error('Missing GHN configuration');
        }
        this.ghnToken = GHN_TOKEN;
        this.ghnUrlGetPickShift = GHN_GET_PICK_SHIFT_URL;
        
    }
    onModuleInit() {
        this.deliveryGrpcService = this.clientGrpcInstance.getService<PaymentServiceClient>("PaymentService");
    }
    async calculateShippingFee(userId: string, calculateDeliveryRequestDto: CalculateDeliveryRequestDto): Promise<ShippingDetail | Issue[]> {
        try {

            const result = await firstValueFrom(this.deliveryGrpcService.calculateShippingFee({
                suborder: {
                    farm_id: calculateDeliveryRequestDto.suborder.farm_id,
                    products: calculateDeliveryRequestDto.suborder.products.map(product => ({
                        product_id: product.product_id,
                        quantity: product.quantity,
                    })),
                },
                order_info: {
                    user_id: userId,
                    address_id: calculateDeliveryRequestDto.order_info.address_id,
                }
            }));
            if (result.errors && result.errors.issues && Array.isArray(result.errors.issues)) {
                const issues: Issue[] = result.errors.issues.map(issue => IssueMapper.fromGrpcIssue(issue));
                return issues;
            }
            if (Array.isArray(result)) {
                const issues: Issue[] = result.map(issue => IssueMapper.fromGrpcIssue(issue));
                return issues;
            }
            if (result.detail) {
                const shippingDetail = ShippingDetailMapper.fromGrpcShippingDetail(result.detail);
                return shippingDetail;
            }
            this.logger.error('Unknown response structure:', result);
            throw new Error('Invalid response structure from delivery service');

            
        }
        catch (error) {
            this.logger.error('Error in calculateShippingFee:', error);
            throw ErrorMapper.fromGrpcError(error);
        }
    }
    async getDeliveryPickShift(): Promise<PickShiftDto[]> {
        const headers = {
            'Content-Type': 'application/json',
            Token: this.ghnToken,
        };

        return firstValueFrom(
            this.httpService.get<{ data: PickShiftDto[] }>(this.ghnUrlGetPickShift, { headers }).pipe(
                map((response) => {
                    this.logger.debug(`[GHN Get Pick Shift] Raw response: ${JSON.stringify(response.data)}`);
                    const { data } = response.data;

                    if (!Array.isArray(data)) {
                        this.logger.error('[GHN Get Pick Shift] Response missing data array.');
                        throw new InternalServerErrorException('Phản hồi không hợp lệ từ GHN (không có danh sách ca).');
                    }

                    return data;
                }),
                catchError((error: any) => {
                    if (error instanceof HttpException) throw error;

                    const isAxiosError = error instanceof AxiosError;
                    const errorMsg = isAxiosError ? '[Axios]' : '[Unknown]';

                    this.logger.error(`[GHN Get Pick Shift] ${errorMsg} ${error.message}`, error.stack);
                    throw new InternalServerErrorException('Không thể lấy danh sách ca làm việc từ GHN.');
                }),
            )
        );
    }


}