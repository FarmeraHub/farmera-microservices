import { Injectable } from '@nestjs/common';
import { ProxyService } from '../proxy/proxy.service';

@Injectable()
export class HealthService {
  constructor(private readonly proxyService: ProxyService) {}

  async getSystemHealth() {
    const services = this.proxyService.getRegisteredServices();
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => ({
        name: service.name,
        url: service.url,
        healthy: await this.proxyService.checkServiceHealth(service.name),
      }))
    );

    const results = healthChecks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value;
      }
      return {
        name: services[index].name,
        url: services[index].url,
        healthy: false,
        error: 'Health check failed',
      };
    });

    const healthyCount = results.filter(r => r.healthy).length;
    const totalCount = results.length;

    return {
      status: healthyCount === totalCount ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results,
      summary: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: totalCount - healthyCount,
      },
    };
  }

  async getDetailedHealth() {
    const basicHealth = await this.getSystemHealth();
    
    return {
      ...basicHealth,
      gateway: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
      },
    };
  }
} 