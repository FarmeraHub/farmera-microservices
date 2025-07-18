import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Process } from './entities/process.entity';
import { ProcessStep } from './entities/process-step.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Product } from '../products/entities/product.entity';
import { UpdateProcessDto } from './dto/update-process.dto';
import { AssignProductToProcessDto } from './dto/assign-product-process.dto';
import { CreateProcessDto } from './dto/create-process.dto';
import { AssignmentStatus } from 'src/common/enums/process-assignment-status';

@Injectable()
export class ProcessService {
  private readonly logger = new Logger(ProcessService.name);

  constructor(
    @InjectRepository(Process)
    private readonly processRepository: Repository<Process>,
    @InjectRepository(ProcessStep)
    private readonly processStepRepository: Repository<ProcessStep>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async createProcess(
    createDto: CreateProcessDto,
    userId: string,
  ): Promise<Process> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user's farm
      const farm = await this.farmRepository.findOne({
        where: { user_id: userId },
      });

      if (!farm) {
        throw new UnauthorizedException('User does not have a farm');
      }

      // Create process template
      const process = queryRunner.manager.create(Process, {
        process_name: createDto.process_name,
        description: createDto.description,
        farm: farm,
        estimated_duration_days: createDto.estimated_duration_days,
        is_active: createDto.is_active,
      });

      const savedProcess = await queryRunner.manager.save(process);

      // Create process steps
      const steps = createDto.steps.map((stepDto, index) =>
        queryRunner.manager.create(ProcessStep, {
          ...stepDto,
          step_order: index + 1,
          process: savedProcess,
        }),
      );

      await queryRunner.manager.save(ProcessStep, steps);

      await queryRunner.commitTransaction();

      // Reload with steps and farm
      const result = await this.processRepository.findOne({
        where: { process_id: savedProcess.process_id },
        relations: ['steps', 'farm'],
      });

      if (!result) {
        throw new InternalServerErrorException(
          'Failed to reload created process',
        );
      }

      result.step_count = result.steps.length;
      return result;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error creating process: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to create process',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getProcessesByFarm(userId: string): Promise<Process[]> {
    try {
      const farm = await this.farmRepository.findOne({
        where: { user_id: userId },
      });
      if (!farm) {
        throw new UnauthorizedException('User does not have a farm');
      }

      const processes = await this.processRepository
        .createQueryBuilder('process')
        .leftJoinAndSelect('process.steps', 'steps')
        .where('process.farm.farm_id = :farmId', { farmId: farm.farm_id })
        .orderBy('process.created', 'DESC')
        .addOrderBy('steps.step_order', 'ASC')
        .getMany();

      // Add step count to each template
      return processes.map((process) => ({
        ...process,
        step_count: process.steps?.length || 0,
      }));
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error fetching processes: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch processes',
      );
    }
  }

  async getProcessById(
    processId: number,
    userId: string,
  ): Promise<Process> {
    try {
      const template = await this.processRepository
        .createQueryBuilder('process')
        .leftJoinAndSelect('process.steps', 'steps')
        .leftJoinAndSelect('process.farm', 'farm')
        .where('process.process_id = :processId', { processId })
        .andWhere('farm.user_id = :userId', { userId })
        .orderBy('steps.step_order', 'ASC')
        .getOne();

      if (!template) {
        throw new NotFoundException('Process not found');
      }

      template.step_count = template.steps?.length || 0;
      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching process: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch process',
      );
    }
  }

  async updateProcess(
    processId: number,
    updateDto: UpdateProcessDto,
    userId: string,
  ): Promise<Process> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify ownership
      const process = await this.getProcessById(processId, userId);

      // Update template basic info
      const { steps, ...templateData } = updateDto;
      if (Object.keys(templateData).length > 0) {
        await queryRunner.manager.update(
          Process,
          processId,
          templateData,
        );
      }

      // Update steps if provided
      if (steps && steps.length > 0) {
        // Remove existing steps
        await queryRunner.manager.delete(ProcessStep, {
          process: { process_id: processId },
        });

        // Create new steps
        const newSteps = steps.map((stepDto, index) =>
          queryRunner.manager.create(ProcessStep, {
            ...stepDto,
            step_order: index + 1,
            process: process,
          }),
        );

        await queryRunner.manager.save(ProcessStep, newSteps);
      }

      await queryRunner.commitTransaction();

      // Return updated process
      return await this.getProcessById(processId, userId);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Error updating process: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to update process',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Product-Process Assignment Operations
  async assignProductToProcess(
    productId: number,
    assignDto: AssignProductToProcessDto,
    userId: string,
  ): Promise<Process> {
    try {
      // Verify product ownership
      const product = await this.productRepository.findOne({
        where: {
          product_id: productId,
          farm: { user_id: userId },
        },
        // relations: ['farm'],
      });

      if (!product) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      // Verify process ownership and exists
      const process = await this.getProcessById(
        assignDto.process_id,
        userId,
      );

      if (!process.is_active) {
        throw new BadRequestException(
          'Cannot assign inactive process template',
        );
      }

      if (process.assignment_status != AssignmentStatus.UNACTIVATED) {
        throw new BadRequestException(
          'Product is already assigned to an active process',
        );
      }

      // Create assignment
      process.start_date = assignDto.start_date;
      process.target_completion_date = assignDto.target_completion_date;
      process.current_step_order = 1; // Start with first step
      process.assignment_status = AssignmentStatus.ACTIVE;
      process.product = product;

      return await this.processRepository.save(process);

    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error assigning product to process: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to assign product to process',
      );
    }
  }

  async getProductProcess(
    productId: number,
    userId: string,
  ): Promise<Process | null> {
    try {
      const process = await this.processRepository.findOne({
        where: {
          farm: { user_id: userId },
          assignment_status: AssignmentStatus.ACTIVE,
          product: { product_id: productId }
        },
        relations: ['product', 'steps', 'steps.diary_entries']
      });

      if (!process) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      return process;

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Error fetching product process assignment: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch product process assignment',
      );
    }
  }

  async unassignProductFromProcess(
    productId: number,
    userId: string,
  ): Promise<void> {
    try {
      const process = await this.processRepository.findOne(
        {
          where: {
            product: { product_id: productId },
            farm: { user_id: userId }
          }
        }
      );

      if (!process) {
        throw new NotFoundException(
          'No active process assignment found for product',
        );
      }

      process.assignment_status = AssignmentStatus.CANCELLED;
      process.product = null;

      await this.processRepository.save(process);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Error unassigning product from process: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to unassign product from process',
      );
    }
  }

  // Process Steps Management
  async getProcessSteps(
    processId: number,
    userId: string,
  ): Promise<ProcessStep[]> {
    try {
      // Verify ownership through template
      await this.getProcessById(processId, userId);

      return await this.processStepRepository.find({
        where: { process: { process_id: processId } },
        order: { step_order: 'ASC' },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Error fetching process steps: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch process steps');
    }
  }

  async reorderProcessSteps(
    processId: number,
    stepOrders: { step_id: number; step_order: number }[],
    userId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify ownership
      await this.getProcessById(processId, userId);

      // Update step orders
      for (const { step_id, step_order } of stepOrders) {
        await queryRunner.manager.update(
          ProcessStep,
          { step_id, processTemplate: { process_id: processId } },
          { step_order },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Error reordering process steps: ${error.message}`);
      throw new InternalServerErrorException('Failed to reorder process steps');
    } finally {
      await queryRunner.release();
    }
  }
}
