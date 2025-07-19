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
import { StepDiaryEntry } from './entities/step-diary-entry.entity';
import { ProcessStep } from './entities/process-step.entity';
import { Product } from '../products/entities/product.entity';
import { CreateStepDiaryDto } from './dto/create-step-diary.dto';
import { UpdateStepDiaryDto } from './dto/update-step-diary.dto';
import { DiaryCompletionStatus } from 'src/common/enums/diary-completion-status';
import { Process } from './entities/process.entity';
import { AssignmentStatus } from 'src/common/enums/process-assignment-status';

@Injectable()
export class StepDiaryService {
  private readonly logger = new Logger(StepDiaryService.name);

  constructor(
    @InjectRepository(StepDiaryEntry)
    private readonly stepDiaryRepository: Repository<StepDiaryEntry>,
    @InjectRepository(Process)
    private readonly processRepository: Repository<Process>,
    @InjectRepository(ProcessStep)
    private readonly processStepRepository: Repository<ProcessStep>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

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
        }
      });

      if (!product) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      // Verify assignment exists and is active
      const process = await this.processRepository.findOne({
        where: {
          product: { product_id: createDto.product_id },
        }
      });

      if (!process) {
        throw new NotFoundException('Product process assigment not found');
      }

      // Verify step belongs to the assigned process template
      const step = await this.processStepRepository.findOne({
        where: {
          step_id: createDto.step_id,
          process: {
            process_id: process.process_id,
          },
        },
        relations: ['diary_entries']
      });

      if (!step) {
        throw new BadRequestException(
          'Step does not belong to assigned process template',
        );
      }
      const hasCompleted = step.diary_entries.some(
        (d) => d.completion_status === DiaryCompletionStatus.COMPLETED
      );
      if (hasCompleted) {
        throw new BadRequestException("Step is completed");
      }

      // Create diary entry
      const diaryEntry = this.stepDiaryRepository.create({
        step: step,
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
        await this.updateAssignmentProgress(process.process_id);
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
          step: { step_id: stepId },
        },
        order: { recorded_date: 'DESC' },
        relations: ['step'],
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
        where: { step: { process: { product: { product_id: productId } } } },
        order: { step_order: 'ASC', recorded_date: 'DESC' },
        relations: ['step'],
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
      where: { diary_id: updateDto.diary_id, step: { process: { farm: { user_id: userId } } } },
    });

    if (!diary) {
      throw new NotFoundException('Diary entry not found');
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
      relations: ['step', 'step.process'],
    })) as StepDiaryEntry;

    // If completion status changed to COMPLETED, update assignment progress
    if (
      updateDto.completion_status === DiaryCompletionStatus.COMPLETED &&
      previousStatus !== DiaryCompletionStatus.COMPLETED
    ) {
      await this.updateAssignmentProgress(updatedDiary.step.process.process_id);
    }

    return updatedDiary;
  }

  async deleteStepDiary(diaryId: number, userId: string): Promise<boolean> {
    const diary = await this.stepDiaryRepository.findOne({
      where: { diary_id: diaryId, step: { process: { farm: { user_id: userId } } } },
      relations: ['step'],
    });

    if (!diary) {
      throw new NotFoundException('Diary entry not found');
    }

    await this.stepDiaryRepository.delete(diaryId);

    if (diary.completion_status === DiaryCompletionStatus.COMPLETED) {
      await this.updateAssignmentProgress(diary.step.process.process_id);
    }

    return true;
  }

  private async updateAssignmentProgress(processId: number): Promise<void> {
    try {
      const process = await this.processRepository.findOne({
        where: { process_id: processId },
        relations: ['steps'],
      });

      if (!process) {
        return;
      }

      // Count completed steps
      const completedSteps = await this.stepDiaryRepository.count({
        where: {
          completion_status: DiaryCompletionStatus.COMPLETED,
          step: { process: { process_id: processId } }
        },
      });

      const totalSteps = process.steps.length;
      const completionPercentage =
        totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      // Update assignment
      process.completion_percentage = completionPercentage;
      process.current_step_order = completedSteps + 1; // Next step to work on

      if (completionPercentage >= 100) {
        process.assignment_status = AssignmentStatus.COMPLETED;
        process.actual_completion_date = new Date();
      }

      await this.processRepository.save(process);
    } catch (error) {
      this.logger.error(`Error updating assignment progress: ${error.message}`);
      // Don't throw error here, just log it
    }
  }
}
