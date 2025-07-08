import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Farm } from 'src/farms/entities/farm.entity';
import { ApproveDetail } from './entities/approve-detail.entity';
import { DataSource, ILike, Repository } from 'typeorm';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { validate as isUUID } from 'uuid';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMeta } from 'src/pagination/dto/pagination-meta.dto';
import { AdminSearchFarmDto } from './dto/search-farm-admin.dto';

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
      throw new BadRequestException('Invalid UUID format');
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const farm = await transactionalEntityManager.findOne(Farm, {
        where: { farm_id: farmId },
      });
      if (!farm) {
        throw new NotFoundException('Farm not found');
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

  async searchFarm(
    searchDto: AdminSearchFarmDto,
    paginationOptions: PaginationOptions,
  ) {
    // If no pagination options provided, return all categories (for backward compatibility)
    if (!paginationOptions) {
      const where: any = {};
      if (searchDto.query?.trim()) {
        where.farm_name = ILike(`%${searchDto.query}%`);
      }
      const farms = await this.farmRepository.find({
        where,
        relations: ['subcategories'],
        order: { created: 'DESC' },
      });
      if (!farms || farms.length === 0) {
        throw new NotFoundException('Không tìm thấy danh mục nào.');
      }
      return new PaginationResult(farms);
    }

    // Use pagination
    const qb = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoinAndSelect('farm.address', 'address');

    if (searchDto.latitude && searchDto.longitude && searchDto.radius_km) {
      qb.addSelect(
        `
                      6371 * acos(
                      cos(radians(:lat)) *
                      cos(radians(split_part(address.coordinate, ':', 1)::float)) *
                      cos(radians(split_part(address.coordinate, ':', 2)::float) - radians(:lng)) +
                      sin(radians(:lat)) *
                      sin(radians(split_part(address.coordinate, ':', 1)::float))
                      )
                  `,
        'distance',
      ).andWhere(
        `
                      6371 * acos(
                      cos(radians(:lat)) *
                      cos(radians(split_part(address.coordinate, ':', 1)::float)) *
                      cos(radians(split_part(address.coordinate, ':', 2)::float) - radians(:lng)) +
                      sin(radians(:lat)) *
                      sin(radians(split_part(address.coordinate, ':', 1)::float))
                      ) <= :radius
                  `,
        {
          lat: searchDto.latitude,
          lng: searchDto.longitude,
          radius: searchDto.radius_km,
        },
      );
    }

    if (searchDto.query?.trim()) {
      qb.andWhere('farm.farm_name ILIKE :query', {
        query: `%${searchDto.query}%`,
      });
    }

    if (searchDto.status_filter) {
      qb.andWhere('farm.status = :status', { status: searchDto.status_filter });
    }

    // Add sorting if specified
    if (paginationOptions.sort_by) {
      const validSortValue = ['created', 'farm_name', 'status', 'distance'];
      if (!validSortValue.includes(paginationOptions.sort_by)) {
        throw new BadRequestException('Cột sắp xếp không hợp lệ.');
      }
      const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
      switch (paginationOptions.sort_by) {
        case 'name':
          qb.orderBy('farm.farm_name', order);
          break;
        case 'created':
          qb.orderBy('farm.created', order);
          break;
        case 'distance':
          qb.orderBy('distance', order);
        default:
          qb.orderBy('farm.farm_name', 'ASC');
      }
    } else {
      qb.orderBy(
        'farm.farm_name',
        (paginationOptions.order || 'ASC') as 'ASC' | 'DESC',
      );
    }

    // If all=true, return all results without pagination
    if (paginationOptions.all) {
      const farms = await qb.getMany();
      if (!farms || farms.length === 0) {
        throw new NotFoundException('Không tìm thấy danh mục nào.');
      }
      return new PaginationResult(farms);
    }

    // Apply pagination
    const totalItems = await qb.getCount();

    const totalPages = Math.ceil(totalItems / (paginationOptions.limit ?? 10));
    const currentPage = paginationOptions.page ?? 1;

    if (totalPages > 0 && currentPage > totalPages) {
      throw new NotFoundException(
        `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
      );
    }

    const farms = await qb
      .skip(paginationOptions.skip)
      .take(paginationOptions.limit)
      .getMany();

    if (!farms || farms.length === 0) {
      throw new NotFoundException('Không tìm thấy danh mục nào.');
    }

    const meta = new PaginationMeta({
      paginationOptions,
      totalItems,
    });

    return new PaginationResult(farms, meta);
  }
}
