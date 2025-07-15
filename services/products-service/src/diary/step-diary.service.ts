import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StepDiaryEntry,
  DiaryCompletionStatus,
} from './entities/step-diary-entry.entity';
import { ProductProcessAssignment } from '../process/entities/product-process-assignment.entity';
import { ProcessStep } from '../process/entities/process-step.entity';
import { Product } from '../products/entities/product.entity';
import { CreateStepDiaryDto } from './dto/create-step-diary.dto';
import { UpdateStepDiaryDto } from './dto/update-step-diary.dto';

@Injectable()
export class StepDiaryService {
  private readonly logger = new Logger(StepDiaryService.name);

  constructor(
    @InjectRepository(StepDiaryEntry)
    private readonly stepDiaryRepository: Repository<StepDiaryEntry>,
    @InjectRepository(ProductProcessAssignment)
    private readonly assignmentRepository: Repository<ProductProcessAssignment>,
    @InjectRepository(ProcessStep)
    private readonly processStepRepository: Repository<ProcessStep>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createStepDiary(
    createDto: CreateStepDiaryDto,
    userId: string,
  ): Promise<StepDiaryEntry> {
    try {
      // Verify product ownership
      const product = await this.productRepository.findOne({
        where: {
          product_id: createDto.product_id,
          farm: { user_id: userId },
        },
        relations: ['farm'],
      });

      if (!product) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      // Verify assignment exists and is active
      const assignment = await this.assignmentRepository.findOne({
        where: {
          assignment_id: createDto.assignment_id,
          product: { product_id: createDto.product_id },
        },
        relations: ['processTemplate', 'product'],
      });

      if (!assignment) {
        throw new NotFoundException('Product process assignment not found');
      }

      // Verify step belongs to the assigned process template
      const step = await this.processStepRepository.findOne({
        where: {
          step_id: createDto.step_id,
          processTemplate: {
            process_id: assignment.processTemplate.process_id,
          },
        },
      });

      if (!step) {
        throw new BadRequestException(
          'Step does not belong to assigned process template',
        );
      }

      // Create diary entry
      const diaryEntry = this.stepDiaryRepository.create({
        assignment: assignment,
        step: step,
        product_id: createDto.product_id,
        step_name: createDto.step_name,
        step_order: createDto.step_order,
        notes: createDto.notes,
        completion_status: createDto.completion_status,
        image_urls: createDto.image_urls || [],
        video_urls: createDto.video_urls || [],
        recorded_date: createDto.recorded_date || new Date(),
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        weather_conditions: createDto.weather_conditions,
        quality_rating: createDto.quality_rating,
        issues_encountered: createDto.issues_encountered,
        additional_data: createDto.additional_data,
      });

      const savedEntry = await this.stepDiaryRepository.save(diaryEntry);

      // Update assignment progress if step is completed
      if (createDto.completion_status === DiaryCompletionStatus.COMPLETED) {
        await this.updateAssignmentProgress(assignment.assignment_id);
      }

      return savedEntry;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error creating step diary: ${error.message}`);
      throw new InternalServerErrorException('Failed to create step diary');
    }
  }

  async getStepDiaries(
    productId: number,
    stepId: number,
    userId: string,
  ): Promise<StepDiaryEntry[]> {
    try {
      // Verify product ownership
      const product = await this.productRepository.findOne({
        where: {
          product_id: productId,
          farm: { user_id: userId },
        },
      });

      if (!product) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      return await this.stepDiaryRepository.find({
        where: {
          product_id: productId,
          step: { step_id: stepId },
        },
        order: { recorded_date: 'DESC' },
        relations: ['step', 'assignment'],
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error fetching step diaries: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch step diaries');
    }
  }

  async getProductDiaries(
    productId: number,
    userId: string,
  ): Promise<StepDiaryEntry[]> {
    try {
      // Verify product ownership
      const product = await this.productRepository.findOne({
        where: {
          product_id: productId,
          farm: { user_id: userId },
        },
      });

      if (!product) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      return await this.stepDiaryRepository.find({
        where: { product_id: productId },
        order: { step_order: 'ASC', recorded_date: 'DESC' },
        relations: ['step', 'assignment', 'assignment.processTemplate'],
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error fetching product diaries: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch product diaries');
    }
  }

  async updateStepDiary(
    updateDto: UpdateStepDiaryDto,
    userId: string,
  ): Promise<StepDiaryEntry> {
    // Find diary entry
    const diary = await this.stepDiaryRepository.findOne({
      where: { diary_id: updateDto.diary_id },
      relations: [
        'assignment',
        'assignment.product',
        'assignment.product.farm',
      ],
    });

    if (!diary) {
      throw new NotFoundException('Diary entry not found');
    }

    // Verify ownership
    if (diary.assignment?.product?.farm?.user_id !== userId) {
      throw new BadRequestException(
        'You can only update your own diary entries',
      );
    }

    const previousStatus = diary.completion_status;

    // Apply updates
    const updateData: any = { ...updateDto };
    if (updateData.recorded_date) {
      updateData.recorded_date = new Date(updateData.recorded_date) as any;
    }

    await this.stepDiaryRepository.update(updateDto.diary_id, updateData);

    const updatedDiary = (await this.stepDiaryRepository.findOne({
      where: { diary_id: updateDto.diary_id },
      relations: ['assignment', 'step'],
    })) as StepDiaryEntry;

    // If completion status changed to COMPLETED, update assignment progress
    if (
      updateDto.completion_status === DiaryCompletionStatus.COMPLETED &&
      previousStatus !== DiaryCompletionStatus.COMPLETED
    ) {
      await this.updateAssignmentProgress(diary.assignment.assignment_id);
    }

    return updatedDiary;
  }

  async deleteStepDiary(diaryId: number, userId: string): Promise<boolean> {
    const diary = await this.stepDiaryRepository.findOne({
      where: { diary_id: diaryId },
      relations: [
        'assignment',
        'assignment.product',
        'assignment.product.farm',
      ],
    });

    if (!diary) {
      throw new NotFoundException('Diary entry not found');
    }

    if (diary.assignment?.product?.farm?.user_id !== userId) {
      throw new BadRequestException(
        'You can only delete your own diary entries',
      );
    }

    await this.stepDiaryRepository.delete(diaryId);

    if (diary.completion_status === DiaryCompletionStatus.COMPLETED) {
      await this.updateAssignmentProgress(diary.assignment.assignment_id);
    }

    return true;
  }

  private async updateAssignmentProgress(assignmentId: number): Promise<void> {
    try {
      const assignment = await this.assignmentRepository.findOne({
        where: { assignment_id: assignmentId },
        relations: ['processTemplate', 'processTemplate.steps'],
      });

      if (!assignment) {
        return;
      }

      // Count completed steps
      const completedSteps = await this.stepDiaryRepository.count({
        where: {
          assignment: { assignment_id: assignmentId },
          completion_status: DiaryCompletionStatus.COMPLETED,
        },
      });

      const totalSteps = assignment.processTemplate.steps.length;
      const completionPercentage =
        totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      // Update assignment
      assignment.completion_percentage = completionPercentage;
      assignment.current_step_order = completedSteps + 1; // Next step to work on

      if (completionPercentage >= 100) {
        assignment.status = 'COMPLETED' as any;
        assignment.actual_completion_date = new Date();
      }

      await this.assignmentRepository.save(assignment);
    } catch (error) {
      this.logger.error(`Error updating assignment progress: ${error.message}`);
      // Don't throw error here, just log it
    }
  }
}
