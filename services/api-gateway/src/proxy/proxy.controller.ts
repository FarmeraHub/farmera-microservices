import {
  Controller,
  All,
  Param,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Proxy')
@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All(':service(users|products|payment|notification|communication)/*')
  @ApiOperation({ summary: 'Proxy requests to microservices' })
  @ApiParam({
    name: 'service',
    description: 'Target service name (users, products, payment, etc.)',
  })
  async proxyRequest(
    @Param('service') service: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Extract the path after the service name
      const fullPath = req.url;
      const servicePath = fullPath.substring(fullPath.indexOf('/', 1));

      // Remove /api prefix if present
      const cleanPath = servicePath.startsWith('/api')
        ? servicePath.substring(4)
        : servicePath;

      // Forward headers (excluding host to avoid conflicts)
      const forwardHeaders = { ...req.headers };
      delete forwardHeaders.host;
      delete forwardHeaders['content-length'];

      console.log(`[Gateway] Proxying ${req.method} /${service}${cleanPath}`);

      // Forward the request to the target service
      this.proxyService
        .forwardRequest(
          service,
          cleanPath,
          req.method,
          req.body,
          forwardHeaders,
        )
        .subscribe({
          next: (data) => {
            res.status(200).json(data);
          },
          error: (error) => {
            console.error(`[Gateway Error] Service ${service}:`, error.message);

            const status =
              error.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;
            const message = error.message || 'Service unavailable';

            res.status(status).json({
              statusCode: status,
              message,
              service,
              timestamp: new Date().toISOString(),
            });
          },
        });
    } catch (error) {
      console.error('[Gateway] Proxy error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Gateway internal error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Public()
  @All('services/health/:service')
  @ApiOperation({ summary: 'Check individual service health' })
  @ApiParam({ name: 'service', description: 'Service name to check health' })
  async checkServiceHealth(
    @Param('service') service: string,
    @Res() res: Response,
  ) {
    try {
      const isHealthy = await this.proxyService.checkServiceHealth(service);

      if (isHealthy) {
        res.status(200).json({
          service,
          status: 'healthy',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          service,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(500).json({
        service,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Public()
  @All('services')
  @ApiOperation({ summary: 'Get all registered services' })
  getServices(@Res() res: Response) {
    const services = this.proxyService.getRegisteredServices();
    res.status(200).json({
      services,
      count: services.length,
      timestamp: new Date().toISOString(),
    });
  }
}
