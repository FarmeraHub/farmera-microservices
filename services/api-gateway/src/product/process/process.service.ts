import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { AssignProductToProcessDto } from './dto/assign-product-process.dto';
import { CreateStepDiaryDto } from './dto/create-step-diary.dto';
import { UpdateStepDiaryDto } from './dto/update-step-diary.dto';
import { TypesMapper } from '../../mappers/common/types.mapper';
import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { EnumMapper } from 'src/mappers/common/enum.mapper';
import { Process } from './entities/process.entity';
import { ProcessMapper } from 'src/mappers/product/process.mapper';
import { SimpleCursorPagination } from 'src/pagination/dto/pagination-options.dto';

@Injectable()
export class ProcessService {
  private readonly logger = new Logger(ProcessService.name);
  private productGrpcService: ProductsServiceClient;

  constructor(
    @Inject('PRODUCTS_PACKAGE') private client: ClientGrpc,
  ) { }

  onModuleInit() {
    this.productGrpcService =
      this.client.getService<ProductsServiceClient>('ProductsService');
  }

  async createProcess(
    createDto: CreateProcessDto,
    user: UserInterface,
  ): Promise<Process> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.createProcess({
          ...createDto,
          user_id: user.id,
        }),
      );
      return ProcessMapper.fromGrpcProcess(result.process);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProcessesByFarm(user: UserInterface, pagination?: SimpleCursorPagination) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProcessesByFarm({
          user_id: user.id, pagination: {
            limit: pagination?.limit,
            cursor: pagination?.cursor
          }
        }),
      );
      return {
        processes: result.processes.map((value) => ProcessMapper.fromGrpcProcess(value)),
        next_cursor: result.pagination.next_cursor ?? null,
      }
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProcessById(processId: number, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProcessById({
          process_id: processId,
          user_id: user.id,
        }),
      );
      return ProcessMapper.fromGrpcProcess(result.template);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async updateProcess(
    processId: number,
    updateDto: UpdateProcessDto,
    user: UserInterface,
  ) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.updateProcess({
          process_id: processId,
          process_name: updateDto.process_name,
          description: updateDto.description,
          estimated_duration_days: updateDto.estimated_duration_days,
          is_active: updateDto.is_active,
          steps: updateDto.steps,
          user_id: user.id,
        }),
      );

      return ProcessMapper.fromGrpcProcess(result.template);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  // async deleteProcessTemplate(processId: number, user: UserInterface) {
  //   // First check if any products are assigned to this process template
  //   try {
  //     const assignedProducts = await firstValueFrom(
  //       this.productsService.getProductsAssignedToProcess({
  //         process_id: processId,
  //         user_id: user.id,
  //       }),
  //     );

  //     if (assignedProducts?.products && assignedProducts.products.length > 0) {
  //       throw new BadRequestException(
  //         `Không thể xóa quy trình này vì đã có ${assignedProducts.products.length} sản phẩm được gán vào quy trình. Vui lòng hủy gán tất cả sản phẩm trước khi xóa.`,
  //       );
  //     }
  //   } catch (error: any) {
  //     // If the method doesn't exist or has other errors, proceed with deletion (unless it's our validation error)
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     // Log the error but continue with deletion
  //     console.warn('Could not check for assigned products:', error.message);
  //   }

  //   return await firstValueFrom(
  //     this.productsService.deleteProcessTemplate({
  //       process_id: processId,
  //       user_id: user.id,
  //     }),
  //   );
  // }

  async getProcessSteps(processId: number, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProcessSteps({
          process_id: processId,
          user_id: user.id,
        }),
      );
      return result.steps.map((value) => ProcessMapper.fromGrpcProcessStep(value));
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async reorderProcessSteps(
    processId: number,
    stepOrders: { step_id: number; step_order: number }[],
    user: UserInterface,
  ) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.reorderProcessSteps({
          process_id: processId,
          step_orders: stepOrders,
          user_id: user.id,
        }),
      );
      return result.success;
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async assignProductToProcess(
    productId: number,
    assignDto: AssignProductToProcessDto,
    user: UserInterface,
  ) {

    try {
      const result = await firstValueFrom(
        this.productGrpcService.assignProductToProcess({
          product_id: productId,
          process_id: assignDto.process_id,
          start_date: TypesMapper.toGrpcTimestamp(assignDto.start_date),
          target_completion_date: TypesMapper.toGrpcTimestamp(assignDto.target_completion_date),
          user_id: user.id,
        }),
      );
      return ProcessMapper.fromGrpcProcess(result.process);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProductProcess(productId: number, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProductProcess({
          product_id: productId,
          user_id: user.id,
        }),
      );
      return ProcessMapper.fromGrpcProcess(result.process);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async unassignProductFromProcess(productId: number, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.unassignProductFromProcess({
          product_id: productId,
          user_id: user.id,
        }),
      );
      return result.success;
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  // Step Diary methods
  async createStepDiary(createDto: CreateStepDiaryDto, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.createStepDiary(
          {
            step_id: createDto.step_id,
            product_id: createDto.product_id,
            step_name: createDto.step_name,
            step_order: createDto.step_order,
            notes: createDto.notes,
            completion_status: EnumMapper.toGrpcDiaryCompletionStatus(createDto.completion_status),
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
          }
        ),
      );
      return ProcessMapper.fromGrpcStepDiary(result.diary);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getStepDiaries(productId: number, stepId: number, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getStepDiaries({
          product_id: productId,
          step_id: stepId,
          user_id: user.id,
        }),
      );
      return result.diaries.map((value) => ProcessMapper.fromGrpcStepDiary(value));
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProductDiaries(productId: number, user: UserInterface) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProductDiaries({
          product_id: productId,
          user_id: user.id,
        }),
      );
      return result.diaries.map((value) => ProcessMapper.fromGrpcStepDiary(value));
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
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

    try {
      return await firstValueFrom(
        this.productGrpcService.updateStepDiary(grpcRequest),
      );
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async deleteStepDiary(diaryId: number, user: UserInterface) {
    try {
      return await firstValueFrom(
        this.productGrpcService.deleteStepDiary({
          diary_id: diaryId,
          user_id: user.id,
        }),
      );
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }
}
