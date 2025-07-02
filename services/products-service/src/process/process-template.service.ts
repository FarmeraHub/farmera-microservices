import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProcessTemplate } from './entities/process-template.entity';
import { ProcessStep } from './entities/process-step.entity';
import {
  ProductProcessAssignment,
  AssignmentStatus,
} from './entities/product-process-assignment.entity';
import { Farm } from '../farms/entities/farm.entity';
import { Product } from '../products/entities/product.entity';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import {
  AssignProductToProcessDto,
  UpdateProductProcessAssignmentDto,
} from './dto/assign-product-process.dto';

@Injectable()
export class ProcessTemplateService {
  private readonly logger = new Logger(ProcessTemplateService.name);

  constructor(
    @InjectRepository(ProcessTemplate)
    private readonly processTemplateRepository: Repository<ProcessTemplate>,
    @InjectRepository(ProcessStep)
    private readonly processStepRepository: Repository<ProcessStep>,
    @InjectRepository(ProductProcessAssignment)
    private readonly assignmentRepository: Repository<ProductProcessAssignment>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // Process Template CRUD Operations
  async createProcessTemplate(
    createDto: CreateProcessTemplateDto,
    userId: string,
  ): Promise<ProcessTemplate> {
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
      const processTemplate = queryRunner.manager.create(ProcessTemplate, {
        process_name: createDto.process_name,
        description: createDto.description,
        estimated_duration_days: createDto.estimated_duration_days,
        is_active: createDto.is_active,
        farm: farm,
      });

      const savedTemplate = await queryRunner.manager.save(processTemplate);

      // Create process steps
      const steps = createDto.steps.map((stepDto, index) =>
        queryRunner.manager.create(ProcessStep, {
          ...stepDto,
          step_order: index + 1,
          processTemplate: savedTemplate,
        }),
      );

      await queryRunner.manager.save(ProcessStep, steps);

      await queryRunner.commitTransaction();

      // Reload with steps
      const result = await this.processTemplateRepository.findOne({
        where: { process_id: savedTemplate.process_id },
        relations: ['steps'],
      });

      if (!result) {
        throw new InternalServerErrorException(
          'Failed to reload created process template',
        );
      }

      result.step_count = result.steps.length;
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error creating process template: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to create process template',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getProcessTemplatesByFarm(userId: string): Promise<ProcessTemplate[]> {
    try {
      const farm = await this.farmRepository.findOne({
        where: { user_id: userId },
      });
      if (!farm) {
        throw new UnauthorizedException('User does not have a farm');
      }

      const templates = await this.processTemplateRepository
        .createQueryBuilder('pt')
        .leftJoinAndSelect('pt.steps', 'steps')
        .where('pt.farm.farm_id = :farmId', { farmId: farm.farm_id })
        .orderBy('pt.created', 'DESC')
        .addOrderBy('steps.step_order', 'ASC')
        .getMany();

      // Add step count to each template
      return templates.map((template) => ({
        ...template,
        step_count: template.steps?.length || 0,
      }));
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error fetching process templates: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch process templates',
      );
    }
  }

  async getProcessTemplateById(
    processId: number,
    userId: string,
  ): Promise<ProcessTemplate> {
    try {
      const template = await this.processTemplateRepository
        .createQueryBuilder('pt')
        .leftJoinAndSelect('pt.steps', 'steps')
        .leftJoinAndSelect('pt.farm', 'farm')
        .where('pt.process_id = :processId', { processId })
        .andWhere('farm.user_id = :userId', { userId })
        .orderBy('steps.step_order', 'ASC')
        .getOne();

      if (!template) {
        throw new NotFoundException('Process template not found');
      }

      template.step_count = template.steps?.length || 0;
      return template;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching process template: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch process template',
      );
    }
  }

  async updateProcessTemplate(
    processId: number,
    updateDto: UpdateProcessTemplateDto,
    userId: string,
  ): Promise<ProcessTemplate> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify ownership
      const template = await this.getProcessTemplateById(processId, userId);

      // Update template basic info
      const { steps, ...templateData } = updateDto;
      if (Object.keys(templateData).length > 0) {
        await queryRunner.manager.update(
          ProcessTemplate,
          processId,
          templateData,
        );
      }

      // Update steps if provided
      if (steps && steps.length > 0) {
        // Remove existing steps
        await queryRunner.manager.delete(ProcessStep, {
          processTemplate: { process_id: processId },
        });

        // Create new steps
        const newSteps = steps.map((stepDto, index) =>
          queryRunner.manager.create(ProcessStep, {
            ...stepDto,
            step_order: index + 1,
            processTemplate: template,
          }),
        );

        await queryRunner.manager.save(ProcessStep, newSteps);
      }

      await queryRunner.commitTransaction();

      // Return updated template
      return await this.getProcessTemplateById(processId, userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(`Error updating process template: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to update process template',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProcessTemplate(
    processId: number,
    userId: string,
  ): Promise<void> {
    try {
      // Verify ownership
      const template = await this.getProcessTemplateById(processId, userId);

      // Check if template is assigned to any products
      const assignmentCount = await this.assignmentRepository.count({
        where: {
          processTemplate: { process_id: processId },
          status: AssignmentStatus.ACTIVE,
        },
      });

      if (assignmentCount > 0) {
        throw new BadRequestException(
          'Cannot delete process template that is assigned to active products',
        );
      }

      await this.processTemplateRepository.remove(template);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting process template: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to delete process template',
      );
    }
  }

  // Product-Process Assignment Operations
  async assignProductToProcess(
    productId: number,
    assignDto: AssignProductToProcessDto,
    userId: string,
  ): Promise<ProductProcessAssignment> {
    try {
      // Verify product ownership
      const product = await this.productRepository.findOne({
        where: {
          product_id: productId,
          farm: { user_id: userId },
        },
        relations: ['farm'],
      });

      if (!product) {
        throw new UnauthorizedException('Product not found or access denied');
      }

      // Verify process template ownership and exists
      const processTemplate = await this.getProcessTemplateById(
        assignDto.process_id,
        userId,
      );

      if (!processTemplate.is_active) {
        throw new BadRequestException(
          'Cannot assign inactive process template',
        );
      }

      // Check if product is already assigned to a process
      const existingAssignment = await this.assignmentRepository.findOne({
        where: {
          product: { product_id: productId },
          status: AssignmentStatus.ACTIVE,
        },
      });

      if (existingAssignment) {
        throw new BadRequestException(
          'Product is already assigned to an active process',
        );
      }

      // Create assignment
      const assignment = this.assignmentRepository.create({
        product: product,
        processTemplate: processTemplate,
        start_date: assignDto.start_date,
        target_completion_date: assignDto.target_completion_date,
        current_step_order: 1, // Start with first step
      });

      return await this.assignmentRepository.save(assignment);
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

  async getProductProcessAssignment(
    productId: number,
    userId: string,
  ): Promise<ProductProcessAssignment | null> {
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

      return await this.assignmentRepository.findOne({
        where: {
          product: { product_id: productId },
          status: AssignmentStatus.ACTIVE,
        },
        relations: ['processTemplate', 'processTemplate.steps'],
      });
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
      const assignment = await this.getProductProcessAssignment(
        productId,
        userId,
      );

      if (!assignment) {
        throw new NotFoundException(
          'No active process assignment found for product',
        );
      }

      assignment.status = AssignmentStatus.CANCELLED;
      await this.assignmentRepository.save(assignment);
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
      await this.getProcessTemplateById(processId, userId);

      return await this.processStepRepository.find({
        where: { processTemplate: { process_id: processId } },
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
      await this.getProcessTemplateById(processId, userId);

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
