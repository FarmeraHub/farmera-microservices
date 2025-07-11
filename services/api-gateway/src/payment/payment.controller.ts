import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User as UserInterface } from 'src/common/interfaces/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { PaymentClientService } from './payment.client.service';
import { ProcessPaymentDto } from './dto/cart.dto';
import { OrderRequestDto } from './order/dto/order.dto';
import { OrderStatus } from '@farmera/grpc-proto/dist/common/enums';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentClientService: PaymentClientService) {}

  // Helper method to convert frontend status strings to backend OrderStatus enum
  private mapFrontendStatusToOrderStatus(
    frontendStatus: string,
  ): OrderStatus | undefined {
    const statusMap: Record<string, OrderStatus> = {
      PROCESSING: OrderStatus.ORDER_STATUS_PROCESSING,
      TOSHIP: OrderStatus.ORDER_STATUS_PROCESSING, // Map toShip to processing
      SHIPPING: OrderStatus.ORDER_STATUS_SHIPPED,
      DELIVERED: OrderStatus.ORDER_STATUS_DELIVERED,
      CANCELED: OrderStatus.ORDER_STATUS_CANCELED,
      CANCELLED: OrderStatus.ORDER_STATUS_CANCELED,
      RETURNED: OrderStatus.ORDER_STATUS_RETURNED,
      PENDING: OrderStatus.ORDER_STATUS_PENDING,
      PAID: OrderStatus.ORDER_STATUS_PAID,
      FAILED: OrderStatus.ORDER_STATUS_FAILED,
    };

    return statusMap[frontendStatus?.toUpperCase()];
  }

  // Cart operations are handled on the frontend for better performance
  // Orders are created directly from cart data

  // Order endpoints
  @Post('orders/create')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: OrderRequestDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async createOrder(
    @User() user: UserInterface,
    @Body() orderRequestDto: OrderRequestDto,
  ) {
    try {
      console.log(
        'Creating order for user:',
        user.id,
        'with data:',
        JSON.stringify(orderRequestDto),
      );

      // Call the gRPC payment service to create the order
      const grpcRequest = {
        suborders: orderRequestDto.suborders.map((suborder) => ({
          farm_id: suborder.farm_id,
          products: suborder.products.map((product) => ({
            product_id: product.product_id,
            quantity: product.quantity,
          })),
        })),
        order_info: {
          user_id: user.id,
          address_id: orderRequestDto.order_info.address_id,
          payment_type: orderRequestDto.order_info.payment_type || 'COD',
        },
      };

      const response = await this.paymentClientService.createOrder(grpcRequest);

      if (response.errors) {
        console.error('Order creation failed with errors:', response.errors);
        return {
          success: false,
          message: 'Order creation failed',
          errors: response.errors.issues,
        };
      }

      if (response.full_order) {
        console.log('Order created successfully:', response.full_order.order);

        const order = response.full_order.order;
        const payment = response.full_order.payment;

        return {
          success: true,
          message: 'Order created successfully',
          order: {
            orderId: order.order_id,
            customerId: order.customer_id,
            totalAmount: order.total_amount,
            shippingAmount: order.shipping_amount,
            finalAmount: order.final_amount,
            status: order.status,
            currency: order.currency,
            createdAt: order.created,
          },
          payment: payment
            ? {
                paymentId: payment.payment_id,
                amount: payment.amount,
                method: payment.method,
                status: payment.status,
                checkoutUrl: payment.checkout_url,
                qrCode: payment.qr_code,
              }
            : undefined,
          suborders: response.full_order.suborders?.map((sub) => ({
            subOrderId: sub.sub_order.sub_order_id,
            farmId: sub.sub_order.farm_id,
            totalAmount: sub.sub_order.total_amount,
            shippingAmount: sub.sub_order.shipping_amount,
            finalAmount: sub.sub_order.final_amount,
            status: sub.sub_order.status,
            items: sub.order_items?.map((item) => ({
              itemId: item.item_id,
              productId: item.product_id,
              productName: item.product_name,
              pricePerUnit: item.price_per_unit,
              quantity: item.request_quantity,
              totalPrice: item.total_price,
              unit: item.unit,
              imageUrl: item.image_url,
            })),
          })),
        };
      }

      throw new Error('Unexpected response from payment service');
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async getUserOrders(
    @User() user: UserInterface,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    try {
      // Convert frontend status string to backend OrderStatus enum
      const orderStatus = status
        ? this.mapFrontendStatusToOrderStatus(status)
        : undefined;

      const response = await this.paymentClientService.getUserOrders({
        user_id: user.id,
        pagination: {
          page,
          limit,
        },
        status_filter: orderStatus,
      });

      // Map OrderWithItems to frontend format
      const mappedOrders =
        response.orders?.map((orderWithItems) => {
          const order = orderWithItems.order;
          const subOrders = orderWithItems.sub_orders || [];

          // Flatten all items from all sub_orders
          const allItems = subOrders.flatMap(
            (subOrder) =>
              subOrder.order_items?.map((item) => ({
                id: item.item_id?.toString() || '',
                product: {
                  id: item.product_id?.toString() || '',
                  name: item.product_name || '',
                  price: item.price_per_unit || 0,
                  imageUrls: item.image_url ? [item.image_url] : [],
                  unit: item.unit || '',
                },
                quantity: item.request_quantity || 0,
                totalPrice: item.total_price || 0,
                shopId: subOrder.sub_order?.farm_id || '',
              })) || [],
          );

          return {
            id: order?.order_id?.toString() || '',
            customerId: order?.customer_id || '',
            totalAmount: order?.total_amount || 0,
            shippingAmount: order?.shipping_amount || 0,
            finalAmount: order?.final_amount || 0,
            status: order?.status || 'ORDER_STATUS_PENDING',
            currency: order?.currency || 'VND',
            createdAt: order?.created || null,
            items: allItems,
            subOrders: subOrders.map((subOrder) => ({
              subOrderId: subOrder.sub_order?.sub_order_id?.toString() || '',
              farmId: subOrder.sub_order?.farm_id || '',
              totalAmount: subOrder.sub_order?.total_amount || 0,
              shippingAmount: subOrder.sub_order?.shipping_amount || 0,
              finalAmount: subOrder.sub_order?.final_amount || 0,
              status: subOrder.sub_order?.status || 'SUB_ORDER_STATUS_PENDING',
              items:
                subOrder.order_items?.map((item) => ({
                  itemId: item.item_id?.toString() || '',
                  productId: item.product_id?.toString() || '',
                  productName: item.product_name || '',
                  pricePerUnit: item.price_per_unit || 0,
                  quantity: item.request_quantity || 0,
                  totalPrice: item.total_price || 0,
                  unit: item.unit || '',
                  imageUrl: item.image_url || '',
                })) || [],
            })),
          };
        }) || [];

      return {
        orders: mappedOrders,
        total: response.pagination?.total_items || 0,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve orders: ${error.message}`);
    }
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async getOrderById(
    @User() user: UserInterface,
    @Param('orderId') orderId: string,
  ) {
    try {
      const response = await this.paymentClientService.getOrder({
        order_id: parseInt(orderId),
        user_id: user.id,
        include_items: true,
        include_payment: true,
        include_delivery: true,
      });

      if (response.order) {
        const order = response.order;
        return {
          success: true,
          order: {
            orderId: order.order_id,
            customerId: order.customer_id,
            totalAmount: order.total_amount,
            shippingAmount: order.shipping_amount,
            finalAmount: order.final_amount,
            status: order.status,
            currency: order.currency,
            createdAt: order.created,
          },
        };
      }

      return {
        success: false,
        message: 'Order not found',
      };
    } catch (error) {
      throw new Error(`Failed to retrieve order: ${error.message}`);
    }
  }

  // Payment endpoints
  @Get('methods')
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  async getPaymentMethods() {
    return [
      {
        id: 'COD',
        name: 'Thanh toán khi nhận hàng',
        description: 'Thanh toán bằng tiền mặt khi nhận hàng',
        enabled: true,
      },
      {
        id: 'PAYOS',
        name: 'PayOs',
        description: 'Thanh toán qua cổng PayOs',
        enabled: true,
      },
    ];
  }

  @Post('process')
  @ApiOperation({ summary: 'Process payment for order' })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async processPayment(
    @User() user: UserInterface,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    // TODO: Implement payment processing
    if (processPaymentDto.paymentMethod === 'COD') {
      return {
        success: true,
        message: 'Order confirmed for cash on delivery',
        paymentStatus: 'PENDING',
      };
    } else if (processPaymentDto.paymentMethod === 'PAYOS') {
      // TODO: Integrate with PayOs service to create payment URL
      return {
        success: true,
        message: 'Redirect to PayOs payment gateway',
        redirectUrl: 'https://pay.payos.vn/web/checkout-url', // This should come from PayOs service
        paymentStatus: 'REDIRECT',
      };
    }

    return {
      success: false,
      message: 'Unsupported payment method',
    };
  }

  @Get('orders/:orderId/shipping-fee')
  @ApiOperation({ summary: 'Get shipping fee for order products' })
  @ApiResponse({
    status: 200,
    description: 'Shipping fee calculated successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async getShippingFee(
    @Param('orderId') orderId: string,
    @Query('productIds') productIds: string,
  ) {
    // This now uses GHN integration in the backend
    const productIdArray = productIds ? productIds.split(',') : [];
    const baseShippingFee = 25000; // GHN typical fee
    const totalShippingFee = productIdArray.length * baseShippingFee;

    return {
      orderId,
      productIds: productIdArray,
      shippingFee: totalShippingFee,
      currency: 'VND',
      provider: 'GHN',
    };
  }
}
