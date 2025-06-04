import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Farmera API Gateway v1.0.0 - Central microservices entry point';
  }
} 