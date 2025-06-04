import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { Observable, catchError, map } from 'rxjs';

export interface ServiceConfig {
  name: string;
  url: string;
  healthPath?: string;
}

@Injectable()
export class ProxyService {
  private readonly services: Map<string, ServiceConfig> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.initializeServices();
  }

  private initializeServices() {
    const services: ServiceConfig[] = [
      {
        name: 'users',
        url: this.configService.get<string>('USERS_SERVICE_URL', 'http://localhost:3001'),
        healthPath: '/health',
      },
      {
        name: 'products',
        url: this.configService.get<string>('PRODUCTS_SERVICE_URL', 'http://localhost:3002'),
        healthPath: '/health',
      },
      {
        name: 'payment',
        url: this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://localhost:3003'),
        healthPath: '/health',
      },
      {
        name: 'notification',
        url: this.configService.get<string>('NOTIFICATION_SERVICE_URL', 'http://localhost:3004'),
        healthPath: '/health',
      },
      {
        name: 'communication',
        url: this.configService.get<string>('COMMUNICATION_SERVICE_URL', 'http://localhost:3005'),
        healthPath: '/health',
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, service);
    });
  }

  getServiceUrl(serviceName: string): string {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new HttpException(`Service ${serviceName} not found`, HttpStatus.NOT_FOUND);
    }
    return service.url;
  }

  forwardRequest(
    serviceName: string,
    path: string,
    method: string,
    data?: any,
    headers?: any,
  ): Observable<any> {
    const serviceUrl = this.getServiceUrl(serviceName);
    const fullUrl = `${serviceUrl}${path}`;

    console.log(`[Proxy] ${method} ${serviceName} -> ${fullUrl}`);

    let request$: Observable<AxiosResponse<any>>;

    switch (method.toUpperCase()) {
      case 'GET':
        request$ = this.httpService.get(fullUrl, { headers });
        break;
      case 'POST':
        request$ = this.httpService.post(fullUrl, data, { headers });
        break;
      case 'PUT':
        request$ = this.httpService.put(fullUrl, data, { headers });
        break;
      case 'PATCH':
        request$ = this.httpService.patch(fullUrl, data, { headers });
        break;
      case 'DELETE':
        request$ = this.httpService.delete(fullUrl, { headers });
        break;
      default:
        throw new HttpException(`Method ${method} not supported`, HttpStatus.METHOD_NOT_ALLOWED);
    }

    return request$.pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`[Proxy Error] ${serviceName}:`, error.response?.data || error.message);
        
        const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = error.response?.data?.message || error.message || 'Service unavailable';
        
        throw new HttpException(message, status);
      }),
    );
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = this.services.get(serviceName);
      if (!service) return false;

      const healthUrl = `${service.url}${service.healthPath || '/health'}`;
      const response = await this.httpService.get(healthUrl).toPromise();
      
      return response?.status === 200;
    } catch (error) {
      console.error(`[Health Check] ${serviceName} failed:`, error.message);
      return false;
    }
  }

  getRegisteredServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }
} 