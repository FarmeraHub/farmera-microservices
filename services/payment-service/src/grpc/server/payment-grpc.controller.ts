import { Subcategory } from './../../product/category/entities/subcategory.entity';
import { Controller, Logger, Get } from '@nestjs/common';
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
  GetSubOrderByIDRequest,
  GetSubOrderByIDResponse,
  GetSubOrdersByFarmRequest,
  GetSubOrdersByFarmResonse,
  GetSubOrdersByUserRequest,
  GetSubOrdersByUserResponse,
  FullSubOrderResponse,
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
import { SubOrderService } from 'src/orders/sub-order/sub-order.service';

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
    private readonly subOrderService: SubOrderService,
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

      const order = await this.ordersService.getOrderById(
        request.order_id.toString(),
        request.user_id, // Now we have user_id in the proto
      );

      if (!order) {
        throw ErrorMapper.toRpcException(new Error('Order not found'));
      }

      // Use toGrpcOrderWithItems to include sub_orders and order_details
      const grpcOrderWithItems = OrderMapper.toGrpcOrderWithItems(order);
      return {
        order: grpcOrderWithItems,
      };
    } catch (error) {
      this.logger.error('Error getting order', error);
      throw ErrorMapper.toRpcException(error);
    }
  }

  // Helper method to convert gRPC OrderStatus enum to database OrderStatus enum
  private mapGrpcOrderStatusToDbStatus(grpcStatus: any): string | undefined {
    if (!grpcStatus) return undefined;

    const statusString = grpcStatus.toString();
    const statusMap: Record<string, string> = {
      ORDER_STATUS_PENDING: 'PENDING',
      ORDER_STATUS_PROCESSING: 'PROCESSING',
      ORDER_STATUS_SHIPPED: 'SHIPPED',
      ORDER_STATUS_DELIVERED: 'DELIVERED',
      ORDER_STATUS_CANCELED: 'CANCELED',
      ORDER_STATUS_RETURNED: 'RETURNED',
      ORDER_STATUS_FAILED: 'FAILED',
      ORDER_STATUS_PAID: 'PAID',
    };

    return statusMap[statusString];
  }

  async getUserOrders(
    request: GetUserOrdersRequest,
  ): Promise<GetUserOrdersResponse> {
    try {
      this.logger.log('Received GetUserOrdersRequest', request);

      const page = request.pagination?.page || 1;
      const limit = request.pagination?.limit || 10;
      // Convert gRPC enum to database enum format
      const status = request.status_filter
        ? this.mapGrpcOrderStatusToDbStatus(request.status_filter)
        : undefined;

      const result = await this.ordersService.getOrdersByUserId(
        request.user_id,
        status,
        page,
        limit,
      );

      const grpcOrdersWithItems = result.orders.map((order) =>
        OrderMapper.toGrpcOrderWithItems(order),
      );

      return {
        orders: grpcOrdersWithItems,
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

  async getSubOrderById(
    request: GetSubOrderByIDRequest,
  ): Promise<GetSubOrderByIDResponse> {
    try {
      this.logger.log('Received GetSubOrderByIDRequest', request);

      const subOrder = await this.subOrderService.getSubOrderById(
        request.suborder_id,
      );
      this.logger.log('SubOrder retrieved:', JSON.stringify(subOrder, null, 2));

      if (!subOrder) {
        throw ErrorMapper.toRpcException(new Error('Sub-order not found'));
      }

      const grpcSubOrder = SubOrderMapper.toGrpcSubOrder(subOrder);
      this.logger.log(`GrpcSubOrder: ${JSON.stringify(grpcSubOrder, null, 2)}`);
      const grpcOrderDetail = subOrder.order_details
        ? subOrder.order_details.map(OrderDetailMapper.toGrpcOrderItem)
        : [];
      if (subOrder.order) {
        const grpcOrder = OrderMapper.toGrpcOrder(subOrder.order);
        const grpcPayment = subOrder.order.payment
          ? PaymentMapper.toGrpcPayment(subOrder.order.payment)
          : undefined;
        return {
          order: grpcOrder,
          payment: grpcPayment,
          suborder: {
            sub_order: grpcSubOrder,
            order_items: grpcOrderDetail,
          },
        };
      }
      return {
        payment: undefined,
        suborder: {
          sub_order: grpcSubOrder,
          order_items: grpcOrderDetail,
        },
      };
    } catch (error) {
      this.logger.error('Error getting sub-order by ID', error);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getSubOrdersByFarm(
    request: GetSubOrdersByFarmRequest,
  ): Promise<GetSubOrdersByFarmResonse> {
    try {
      this.logger.log('Received GetSubOrdersByFarmRequest', request);

      // const page = request.pagination?.page || 1;
      // const limit = request.pagination?.limit || 10;
      // const status = request.status_filter;
      const page = request.pagination?.page || 1;
      const limit = request.pagination?.limit || 10;

      const result = await this.subOrderService.getSubOrdersByFarmId(
        request.farm_id,
        request.status,
        page,
        limit,
      );

      const suborders: FullSubOrderResponse[] = result.subOrders.map(
        (subOrder) => ({
          order: subOrder.order
            ? OrderMapper.toGrpcOrder(subOrder.order)
            : undefined,
          payment: subOrder.order?.payment
            ? PaymentMapper.toGrpcPayment(subOrder.order.payment)
            : undefined,
          suborder: {
            sub_order: SubOrderMapper.toGrpcSubOrder(subOrder),
            order_items: subOrder.order_details
              ? subOrder.order_details.map(OrderDetailMapper.toGrpcOrderItem)
              : [],
          },
        }),
      );

      return {
        suborders: suborders,
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
      this.logger.error('Error getting sub-orders by farm', error);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getSubOrdersByUser(
    request: GetSubOrdersByUserRequest,
  ): Promise<GetSubOrdersByUserResponse> {
    try {
      this.logger.log('Received GetSubOrdersByUserRequest', request);

      const page = request.pagination?.page || 1;
      const limit = request.pagination?.limit || 10;
      // const status = request.status_filter;

      const result = await this.subOrderService.getSubOrdersByCustomerId(
        request.user_id,
        request.status? request.status : undefined,
        page,
        limit,
        );

      this.logger.log(
        `SubOrders retrieved: ${JSON.stringify(result, null, 2)}`,
      );
      const suborders: FullSubOrderResponse[] = result.subOrders.map(
        (subOrder) => ({
          order: subOrder.order
            ? OrderMapper.toGrpcOrder(subOrder.order)
            : undefined,
          payment: subOrder.order?.payment
            ? PaymentMapper.toGrpcPayment(subOrder.order.payment)
            : undefined,
          suborder: {
            sub_order: SubOrderMapper.toGrpcSubOrder(subOrder),
            order_items: subOrder.order_details
              ? subOrder.order_details.map(OrderDetailMapper.toGrpcOrderItem)
              : [],
          },
        }),
      );

      return {
        suborders: suborders,
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
      this.logger.error('Error getting sub-orders by user', error);
      throw ErrorMapper.toRpcException(error);
    }
  }
}
