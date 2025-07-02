import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import { AssignProductToProcessDto } from './dto/assign-product-process.dto';

interface CreateProcessTemplateRequest {
  process_name: string;
  description: string;
  estimated_duration_days?: number;
  is_active?: boolean;
  steps: CreateProcessStepRequest[];
  user_id: string;
}

interface CreateProcessStepRequest {
  step_order: number;
  step_name: string;
  step_description: string;
  is_required?: boolean;
  estimated_duration_days?: number;
  instructions?: string;
}

interface UpdateProcessTemplateRequest {
  process_id: number;
  process_name?: string;
  description?: string;
  estimated_duration_days?: number;
  is_active?: boolean;
  steps?: UpdateProcessStepRequest[];
  user_id: string;
}

interface UpdateProcessStepRequest {
  step_id?: number;
  step_order?: number;
  step_name?: string;
  step_description?: string;
  is_required?: boolean;
  estimated_duration_days?: number;
  instructions?: string;
}

interface AssignProductToProcessRequest {
  product_id: number;
  process_id: number;
  start_date?: string;
  target_completion_date?: string;
  user_id: string;
}

interface ProductsGrpcService {
  createProcessTemplate: (
    data: CreateProcessTemplateRequest,
  ) => Observable<any>;
  getProcessTemplatesByFarm: (data: { user_id: string }) => Observable<any>;
  getProcessTemplateById: (data: {
    process_id: number;
    user_id: string;
  }) => Observable<any>;
  updateProcessTemplate: (
    data: UpdateProcessTemplateRequest,
  ) => Observable<any>;
  deleteProcessTemplate: (data: {
    process_id: number;
    user_id: string;
  }) => Observable<any>;
  getProcessSteps: (data: {
    process_id: number;
    user_id: string;
  }) => Observable<any>;
  reorderProcessSteps: (data: {
    process_id: number;
    step_orders: { step_id: number; step_order: number }[];
    user_id: string;
  }) => Observable<any>;
  assignProductToProcess: (
    data: AssignProductToProcessRequest,
  ) => Observable<any>;
  getProductProcessAssignment: (data: {
    product_id: number;
    user_id: string;
  }) => Observable<any>;
  unassignProductFromProcess: (data: {
    product_id: number;
    user_id: string;
  }) => Observable<any>;
  createStepDiary: (data: any) => Observable<any>;
  getStepDiaries: (data: {
    product_id: number;
    step_id: number;
    user_id: string;
  }) => Observable<any>;
  getProductDiaries: (data: {
    product_id: number;
    user_id: string;
  }) => Observable<any>;
}

@Injectable()
export class ProcessTemplateService {
  private productsService: ProductsGrpcService;

  constructor(@Inject('PRODUCTS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.productsService =
      this.client.getService<ProductsGrpcService>('ProductsService');
  }

  async createProcessTemplate(
    createDto: CreateProcessTemplateDto,
    user: UserInterface,
  ) {
    return await firstValueFrom(
      this.productsService.createProcessTemplate({
        ...createDto,
        user_id: user.id,
      }),
    );
  }

  async getProcessTemplatesByFarm(user: UserInterface) {
    return await firstValueFrom(
      this.productsService.getProcessTemplatesByFarm({ user_id: user.id }),
    );
  }

  async getProcessTemplateById(processId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.getProcessTemplateById({
        process_id: processId,
        user_id: user.id,
      }),
    );
  }

  async updateProcessTemplate(
    processId: number,
    updateDto: UpdateProcessTemplateDto,
    user: UserInterface,
  ) {
    return await firstValueFrom(
      this.productsService.updateProcessTemplate({
        process_id: processId,
        ...updateDto,
        user_id: user.id,
      }),
    );
  }

  async deleteProcessTemplate(processId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.deleteProcessTemplate({
        process_id: processId,
        user_id: user.id,
      }),
    );
  }

  async getProcessSteps(processId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.getProcessSteps({
        process_id: processId,
        user_id: user.id,
      }),
    );
  }

  async reorderProcessSteps(
    processId: number,
    stepOrders: { step_id: number; step_order: number }[],
    user: UserInterface,
  ) {
    return await firstValueFrom(
      this.productsService.reorderProcessSteps({
        process_id: processId,
        step_orders: stepOrders,
        user_id: user.id,
      }),
    );
  }

  async assignProductToProcess(
    productId: number,
    assignDto: AssignProductToProcessDto,
    user: UserInterface,
  ) {
    return await firstValueFrom(
      this.productsService.assignProductToProcess({
        product_id: productId,
        ...assignDto,
        user_id: user.id,
      }),
    );
  }

  async getProductProcessAssignment(productId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.getProductProcessAssignment({
        product_id: productId,
        user_id: user.id,
      }),
    );
  }

  async unassignProductFromProcess(productId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.unassignProductFromProcess({
        product_id: productId,
        user_id: user.id,
      }),
    );
  }

  // Step Diary methods
  async createStepDiary(createDto: any, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.createStepDiary({
        ...createDto,
        user_id: user.id,
      }),
    );
  }

  async getStepDiaries(productId: number, stepId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.getStepDiaries({
        product_id: productId,
        step_id: stepId,
        user_id: user.id,
      }),
    );
  }

  async getProductDiaries(productId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.getProductDiaries({
        product_id: productId,
        user_id: user.id,
      }),
    );
  }
}
