import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  PaymentServiceControllerMethods,
  PaymentServiceController,
  CalculateShippingFeeRequest,
  CalculateShippingFeeResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  HandlePaymentCallbackRequest,
  HandlePaymentCallbackResponse,
  GetOrderRequest,
  GetOrderResponse,
  GetUserOrdersRequest,
  GetUserOrdersResponse,
  CreatePayOSPaymentRequest,
  CreatePayOSPaymentResponse,
  VerifyPayOSReturnRequest,
  VerifyPayOSReturnResponse,
} from '@farmera/grpc-proto/dist/payment/payment';
import { Observable } from 'rxjs';
import { DeliveryService } from 'src/delivery/delivery.service';
import { OrdersService } from 'src/orders/order/orders.service';
import { BusinessValidationService } from 'src/business-validation/business-validation.service';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { DeliveryMapper } from 'src/mappers/payment/delivery.mapper';
import { IssueMapper } from 'src/mappers/payment/Issue.mapper';
import { OrderMapper } from 'src/mappers/payment/order.mapper';
import { PaymentMapper } from 'src/mappers/payment/payment.mapper';
import { SubOrderMapper } from 'src/mappers/payment/suborder.mapper';
import { OrderDetailMapper } from 'src/mappers/payment/order-detail.mapper';
import { PayosWebhookDto } from 'src/payos/dto/payos-webhook.dto';
import { PaymentService } from 'src/payments/payment.service';
import { DataPaymentCallbackMapper } from 'src/mappers/payment/data_payment_callback.mapper';
import { PayOSService } from 'src/payos/payos.service';

@Controller()
@PaymentServiceControllerMethods()
export class PaymentGrpcController implements PaymentServiceController {
  private readonly logger = new Logger(PaymentGrpcController.name);
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly ordersService: OrdersService,
    private readonly businessValidationService: BusinessValidationService,
    private readonly paymentService: PaymentService,
    private readonly payosService: PayOSService,
  ) {}

  async calculateShippingFee(
    request: CalculateShippingFeeRequest,
  ): Promise<CalculateShippingFeeResponse> {
    try {
      const result = await this.deliveryService.CalculateShippingFee({
        suborder: {
          farm_id: request.suborder!.farm_id,
          products: request.suborder!.products.map((product) => ({
            product_id: product.product_id,
            quantity: product.quantity,
          })),
        },
        order_info: {
          user_id: request.order_info!.user_id,
          address_id: request.order_info!.address_id,
        },
      });
      if (Array.isArray(result)) {
        const issues = result.map((issue) => IssueMapper.toGrpcIssue(issue));
        return { errors: { issues } };
      } else {
        const shippingFeeDetails =
          DeliveryMapper.toGrpcShippingFeeDetails(result);
        return { detail: shippingFeeDetails };
      }
    } catch (error) {
      throw ErrorMapper.toRpcException(error);
    }
  }
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      this.logger.log('Received CreateOrderRequest', request);
      const result = await this.ordersService.createOrder({
        suborders: request.suborders.map((suborder) => ({
          farm_id: suborder.farm_id,
          products: suborder.products.map((product) => ({
            product_id: product.product_id,
            quantity: product.quantity,
          })),
        })),
        order_info: {
          user_id: request.order_info!.user_id,
          address_id: request.order_info!.address_id,
          payment_type: request.order_info?.payment_type
            ? request.order_info.payment_type
            : 'COD',
        },
      });
      if (Array.isArray(result)) {
        const issues = result.map((issue) => IssueMapper.toGrpcIssue(issue));
        return { errors: { issues } };
      } else {
        this.logger.log('Order created successfully', result);
        this.logger.log(
          `OrderMapper.toGrpcOrder: ${JSON.stringify(result, null, 2)}`,
        );
        const order = OrderMapper.toGrpcOrder(result);
        const payment = result.payment
          ? PaymentMapper.toGrpcPayment(result.payment)
          : undefined;
        const suborders = result.sub_orders.map((subOrder) => ({
          sub_order: SubOrderMapper.toGrpcSubOrder(subOrder),
          order_items: subOrder.order_details
            ? subOrder.order_details.map(OrderDetailMapper.toGrpcOrderItem)
            : [],
        }));

        const fullOrderResponse = { order, payment, suborders };
        this.logger.log(
          `FullOrderResponse: ${JSON.stringify(fullOrderResponse, null, 2)}`,
        );
        return {
          full_order: fullOrderResponse,
        };
      }
    } catch (error) {
      this.logger.error('Error creating order', error);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async handlePaymentCallback(
    request: HandlePaymentCallbackRequest,
  ): Promise<HandlePaymentCallbackResponse> {
    try {
      if (request.data === null || request.data === undefined) {
        throw new Error('PayOS callback data is null or undefined');
      }
      const payosData = DataPaymentCallbackMapper.fromGrpcDataPaymentCallback(
        request.data,
      );
      const result = await this.paymentService.handlePayOSCallback({
        code: request.code,
        desc: request.desc,
        success: request.success,
        data: payosData!,
        signature: request.signature,
      });
      return {
        success: result,
        message: result
          ? 'Payment callback processed successfully'
          : 'Payment callback processing failed',
      };
    } catch (error) {
      this.logger.error('Error processing payment callback', error);
      throw error;
    }
  }

  async createPayOsPayment(
    request: CreatePayOSPaymentRequest,
  ): Promise<CreatePayOSPaymentResponse> {
    try {
      this.logger.log('Received CreatePayOSPaymentRequest', request);

      const result = await this.payosService.createPayOSOrder(
        request.amount,
        request.description,
        request.order_id,
      );

      return {
        success: true,
        message: 'PayOS payment created successfully',
        checkout_url: result.data?.checkoutUrl || '',
        payment_link_id: result.data?.paymentLinkId || '',
        qr_code: result.data?.qrCode || undefined,
      };
    } catch (error) {
      this.logger.error('Error creating PayOS payment', error);
      return {
        success: false,
        message: `Failed to create PayOS payment: ${error.message}`,
        checkout_url: '',
        payment_link_id: '',
      };
    }
  }

  async verifyPayOsReturn(
    request: VerifyPayOSReturnRequest,
  ): Promise<VerifyPayOSReturnResponse> {
    try {
      this.logger.log('Received VerifyPayOSReturnRequest', request);

      // For now, return a mock verification since we don't have the exact verification method
      // In a real implementation, this would verify the payment parameters
      return {
        success: true,
        message: 'Payment verification completed (mock implementation)',
        data: JSON.stringify(request.params),
      };
    } catch (error) {
      this.logger.error('Error verifying PayOS return', error);
      return {
        success: false,
        message: `Payment verification failed: ${error.message}`,
      };
    }
  }

  async getOrder(request: GetOrderRequest): Promise<GetOrderResponse> {
    try {
      this.logger.log('Received GetOrderRequest', request);

      // Note: Proto doesn't include user_id, so we can't verify ownership here
      // You may want to add user authentication at the API gateway level
      const order = await this.ordersService.getOrderById(
        request.order_id.toString(),
        '', // Empty user_id - consider adding user validation
      );

      if (!order) {
        throw ErrorMapper.toRpcException(new Error('Order not found'));
      }

      const grpcOrder = OrderMapper.toGrpcOrder(order);
      return {
        order: grpcOrder,
      };
    } catch (error) {
      this.logger.error('Error getting order', error);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getUserOrders(
    request: GetUserOrdersRequest,
  ): Promise<GetUserOrdersResponse> {
    try {
      this.logger.log('Received GetUserOrdersRequest', request);

      const page = request.pagination?.page || 1;
      const limit = request.pagination?.limit || 10;
      const status = request.status_filter?.toString(); // Convert enum to string

      const result = await this.ordersService.getOrdersByUserId(
        request.user_id,
        status,
        page,
        limit,
      );

      const grpcOrders = result.orders.map((order) =>
        OrderMapper.toGrpcOrder(order),
      );

      return {
        orders: grpcOrders,
        pagination: {
          current_page: result.page,
          page_size: result.limit,
          total_items: result.total,
          total_pages: Math.ceil(result.total / result.limit),
          has_next_page: result.page * result.limit < result.total,
          has_previous_page: result.page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error getting user orders', error);
      throw ErrorMapper.toRpcException(error);
    }
  }
}
