import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';

interface ProductsGrpcService {
  createProcessTemplate: (data: any) => Observable<any>;
  getProcessTemplatesByFarm: (data: any) => Observable<any>;
  getProcessTemplateById: (data: any) => Observable<any>;
  updateProcessTemplate: (data: any) => Observable<any>;
  deleteProcessTemplate: (data: any) => Observable<any>;
  getProcessSteps: (data: any) => Observable<any>;
  reorderProcessSteps: (data: any) => Observable<any>;
  assignProductToProcess: (data: any) => Observable<any>;
  getProductProcessAssignment: (data: any) => Observable<any>;
  unassignProductFromProcess: (data: any) => Observable<any>;
  createStepDiary: (data: any) => Observable<any>;
  getStepDiaries: (data: any) => Observable<any>;
  getProductDiaries: (data: any) => Observable<any>;
}

@Injectable()
export class ProcessTemplateService {
  private productsService: ProductsGrpcService;

  constructor(@Inject('PRODUCTS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.productsService =
      this.client.getService<ProductsGrpcService>('ProductsService');
  }

  private getUserIdFromRequest(req: Request): string {
    return (req.headers['user-id'] as string) || (req as any).user?.userId;
  }

  async createProcessTemplate(createDto: any, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.createProcessTemplate({
        ...createDto,
        user_id: userId,
      }),
    );
  }

  async getProcessTemplatesByFarm(req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.getProcessTemplatesByFarm({ user_id: userId }),
    );
  }

  async getProcessTemplateById(processId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.getProcessTemplateById({
        process_id: processId,
        user_id: userId,
      }),
    );
  }

  async updateProcessTemplate(processId: number, updateDto: any, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.updateProcessTemplate({
        process_id: processId,
        ...updateDto,
        user_id: userId,
      }),
    );
  }

  async deleteProcessTemplate(processId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.deleteProcessTemplate({
        process_id: processId,
        user_id: userId,
      }),
    );
  }

  async getProcessSteps(processId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.getProcessSteps({
        process_id: processId,
        user_id: userId,
      }),
    );
  }

  async reorderProcessSteps(
    processId: number,
    stepOrders: { step_id: number; step_order: number }[],
    req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.reorderProcessSteps({
        process_id: processId,
        step_orders: stepOrders,
        user_id: userId,
      }),
    );
  }

  async assignProductToProcess(
    productId: number,
    assignDto: any,
    req: Request,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.assignProductToProcess({
        product_id: productId,
        ...assignDto,
        user_id: userId,
      }),
    );
  }

  async getProductProcessAssignment(productId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.getProductProcessAssignment({
        product_id: productId,
        user_id: userId,
      }),
    );
  }

  async unassignProductFromProcess(productId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.unassignProductFromProcess({
        product_id: productId,
        user_id: userId,
      }),
    );
  }

  // Step Diary methods
  async createStepDiary(createDto: any, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.createStepDiary({
        ...createDto,
        user_id: userId,
      }),
    );
  }

  async getStepDiaries(productId: number, stepId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.getStepDiaries({
        product_id: productId,
        step_id: stepId,
        user_id: userId,
      }),
    );
  }

  async getProductDiaries(productId: number, req: Request) {
    const userId = this.getUserIdFromRequest(req);
    return await firstValueFrom(
      this.productsService.getProductDiaries({
        product_id: productId,
        user_id: userId,
      }),
    );
  }
}
