import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Farm } from 'src/farms/entities/farm.entity';
import { ApproveDetail } from './entities/approve-detail.entity';
import { DataSource, Repository } from 'typeorm';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { validate as isUUID } from 'uuid';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMeta } from 'src/pagination/dto/pagination-meta.dto';

@Injectable()
export class FarmAdminService {
  constructor(
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(ApproveDetail)
    private approveDetailRepository: Repository<ApproveDetail>,
    private readonly dataSource: DataSource,
  ) { }

  async getPendingFarms(
    paginationOptions?: PaginationOptions,
  ): Promise<PaginationResult<Farm> | Farm[]> {
    const queryBuilder = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.address', 'address')
      .leftJoinAndSelect('farm.identification', 'identification')
      .where('farm.status = :status', { status: FarmStatus.PENDING })
      .orderBy('farm.created', 'DESC');

    // If no pagination options provided, return all pending farms
    if (!paginationOptions) {
      return await queryBuilder.getMany();
    }

    // Add sorting if specified
    if (paginationOptions.sort_by) {
      const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
      switch (paginationOptions.sort_by) {
        case 'name':
          queryBuilder.orderBy('farm.farm_name', order);
          break;
        case 'created':
          queryBuilder.orderBy('farm.created', order);
          break;
        case 'city':
          queryBuilder.orderBy('address.city', order);
          break;
        default:
          queryBuilder.orderBy('farm.created', 'DESC');
      }
    }

    // If all=true, return all results without pagination
    if (paginationOptions.all) {
      return await queryBuilder.getMany();
    }

    // Apply pagination
    const totalItems = await queryBuilder.getCount();
    const farms = await queryBuilder
      .skip(paginationOptions.skip)
      .take(paginationOptions.limit)
      .getMany();

    const meta = new PaginationMeta({
      paginationOptions,
      totalItems,
    });

    return new PaginationResult(farms, meta);
  }

  async getAllFarmsForAdmin(
    paginationOptions?: PaginationOptions,
  ): Promise<PaginationResult<Farm> | Farm[]> {
    const queryBuilder = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.address', 'address')
      .leftJoinAndSelect('farm.identification', 'identification')
      .orderBy('farm.created', 'DESC');

    // If no pagination options provided, return all farms
    if (!paginationOptions) {
      return await queryBuilder.getMany();
    }

    // Add sorting if specified
    if (paginationOptions.sort_by) {
      const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
      switch (paginationOptions.sort_by) {
        case 'name':
          queryBuilder.orderBy('farm.farm_name', order);
          break;
        case 'created':
          queryBuilder.orderBy('farm.created', order);
          break;
        case 'status':
          queryBuilder.orderBy('farm.status', order);
          break;
        case 'city':
          queryBuilder.orderBy('address.city', order);
          break;
        default:
          queryBuilder.orderBy('farm.created', 'DESC');
      }
    }

    // If all=true, return all results without pagination
    if (paginationOptions.all) {
      return await queryBuilder.getMany();
    }

    // Apply pagination
    const totalItems = await queryBuilder.getCount();
    const farms = await queryBuilder
      .skip(paginationOptions.skip)
      .take(paginationOptions.limit)
      .getMany();

    const meta = new PaginationMeta({
      paginationOptions,
      totalItems,
    });

    return new PaginationResult(farms, meta);
  }

  async getFarmsByStatusForAdmin(
    status: FarmStatus,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginationResult<Farm> | Farm[]> {
    const queryBuilder = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.address', 'address')
      .leftJoinAndSelect('farm.identification', 'identification')
      .where('farm.status = :status', { status })
      .orderBy('farm.created', 'DESC');

    // If no pagination options provided, return all results
    if (!paginationOptions) {
      return await queryBuilder.getMany();
    }

    // Add sorting if specified
    if (paginationOptions.sort_by) {
      const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
      switch (paginationOptions.sort_by) {
        case 'name':
          queryBuilder.orderBy('farm.farm_name', order);
          break;
        case 'created':
          queryBuilder.orderBy('farm.created', order);
          break;
        case 'city':
          queryBuilder.orderBy('address.city', order);
          break;
        default:
          queryBuilder.orderBy('farm.created', 'DESC');
      }
    }

    // If all=true, return all results without pagination
    if (paginationOptions.all) {
      return await queryBuilder.getMany();
    }

    // Apply pagination
    const totalItems = await queryBuilder.getCount();
    const farms = await queryBuilder
      .skip(paginationOptions.skip)
      .take(paginationOptions.limit)
      .getMany();

    const meta = new PaginationMeta({
      paginationOptions,
      totalItems,
    });

    return new PaginationResult(farms, meta);
  }

  async getFarmById(farmId: string): Promise<Farm> {
    if (!isUUID(farmId)) {
      console.log('Farm ID is not a valid UUID:', farmId);
      throw new NotFoundException('Farm not found');
    }
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
    return farm;
  }

  async updateFarmStatus(
    farmId: string,
    dto: UpdateFarmStatusDto,
    adminId: string,
  ): Promise<Farm> {
    if (!isUUID(farmId)) {
      throw new BadRequestException('Invalid UUID format)');
    }
    const farmExists = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });
    if (!farmExists) {
      throw new NotFoundException('Farm not found');
    }
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const farm = await transactionalEntityManager.findOne(Farm, {
        where: { farm_id: farmId },
      });
      if (!farm) {
        throw new NotFoundException('Farm not found within transaction');
      }
      farm.status = dto.status;
      farm.updated = new Date();
      await transactionalEntityManager.save(Farm, farm);

      const approveDetailData = {
        action: dto.status,
        reason: dto.reason || `${dto.status} by admin ${adminId}`,
        admin_id: adminId,
        created: new Date(),
        updated: new Date(),
        farm: farm,
      };
      const approveDetail = transactionalEntityManager.create(
        ApproveDetail,
        approveDetailData,
      );
      await transactionalEntityManager.save(ApproveDetail, approveDetail);

      return farm;
    });
  }
}
