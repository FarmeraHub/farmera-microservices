import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import { AssignProductToProcessDto } from './dto/assign-product-process.dto';
import { CreateStepDiaryDto } from './dto/create-step-diary.dto';
import { UpdateStepDiaryDto } from './dto/update-step-diary.dto';
import { TypesMapper } from '../../mappers/common/types.mapper';

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
  getProductsAssignedToProcess: (data: {
    process_id: number;
    user_id: string;
  }) => Observable<{ products: any[] }>;
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
  updateStepDiary: (data: any) => Observable<any>;
  deleteStepDiary: (data: {
    diary_id: number;
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
    // First check if any products are assigned to this process template
    try {
      const assignedProducts = await firstValueFrom(
        this.productsService.getProductsAssignedToProcess({
          process_id: processId,
          user_id: user.id,
        }),
      );

      if (assignedProducts?.products && assignedProducts.products.length > 0) {
        throw new BadRequestException(
          `Không thể xóa quy trình này vì đã có ${assignedProducts.products.length} sản phẩm được gán vào quy trình. Vui lòng hủy gán tất cả sản phẩm trước khi xóa.`,
        );
      }
    } catch (error: any) {
      // If the method doesn't exist or has other errors, proceed with deletion (unless it's our validation error)
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log the error but continue with deletion
      console.warn('Could not check for assigned products:', error.message);
    }

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
    const toGrpcTimestampWrapper = (iso?: string) => {
      if (!iso) return undefined;
      const ms = Date.parse(iso);
      if (isNaN(ms)) {
        throw new BadRequestException('Invalid date format');
      }
      return {
        value: {
          seconds: Math.floor(ms / 1000),
          nanos: (ms % 1000) * 1e6,
        },
      };
    };

    const transformedRequest: any = {
      product_id: productId,
      process_id: assignDto.process_id,
      user_id: user.id,
    };

    if (assignDto.start_date) {
      transformedRequest.start_date = toGrpcTimestampWrapper(
        assignDto.start_date,
      );
    }
    if (assignDto.target_completion_date) {
      transformedRequest.target_completion_date = toGrpcTimestampWrapper(
        assignDto.target_completion_date,
      );
    }

    return await firstValueFrom(
      this.productsService.assignProductToProcess(transformedRequest),
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
  async createStepDiary(createDto: CreateStepDiaryDto, user: UserInterface) {
    // Convert the DTO to the correct format for gRPC
    const grpcRequest = {
      assignment_id: createDto.assignment_id,
      step_id: createDto.step_id,
      product_id: createDto.product_id,
      step_name: createDto.step_name,
      step_order: createDto.step_order,
      notes: createDto.notes,
      completion_status: createDto.completion_status || 'IN_PROGRESS',
      image_urls: createDto.image_urls || [],
      video_urls: createDto.video_urls || [],
      recorded_date: TypesMapper.toGrpcTimestamp(createDto.recorded_date),
      latitude: createDto.latitude,
      longitude: createDto.longitude,
      weather_conditions: createDto.weather_conditions,
      quality_rating: createDto.quality_rating,
      issues_encountered: createDto.issues_encountered,
      additional_data: createDto.additional_data
        ? JSON.stringify(createDto.additional_data)
        : undefined,
      user_id: user.id,
    };

    return await firstValueFrom(
      this.productsService.createStepDiary(grpcRequest),
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

  // Step Diary update and delete methods
  async updateStepDiary(
    updateDto: UpdateStepDiaryDto,
    diaryId: number,
    user: UserInterface,
  ) {
    // Convert the DTO to the correct format for gRPC
    const grpcRequest: any = {
      diary_id: diaryId,
      step_name: updateDto.step_name,
      step_order: updateDto.step_order,
      notes: updateDto.notes,
      completion_status: updateDto.completion_status,
      image_urls: updateDto.image_urls,
      video_urls: updateDto.video_urls,
      recorded_date: updateDto.recorded_date
        ? TypesMapper.toGrpcTimestamp(updateDto.recorded_date)
        : undefined,
      latitude: updateDto.latitude,
      longitude: updateDto.longitude,
      weather_conditions: updateDto.weather_conditions,
      quality_rating: updateDto.quality_rating,
      issues_encountered: updateDto.issues_encountered,
      additional_data: updateDto.additional_data
        ? JSON.stringify(updateDto.additional_data)
        : undefined,
      user_id: user.id,
    };

    return await firstValueFrom(
      this.productsService.updateStepDiary(grpcRequest),
    );
  }

  async deleteStepDiary(diaryId: number, user: UserInterface) {
    return await firstValueFrom(
      this.productsService.deleteStepDiary({
        diary_id: diaryId,
        user_id: user.id,
      }),
    );
  }
}
