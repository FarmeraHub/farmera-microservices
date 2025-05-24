import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Farm } from 'src/farms/entities/farm.entity';
import { ApproveDetail } from './entities/approve-detail.entity';
import { Repository } from 'typeorm';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { validate as isUUID } from 'uuid';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';


@Injectable()
export class FarmAdminService {

    constructor(
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(ApproveDetail)
    private approveDetailRepository: Repository<ApproveDetail>,
    ) {}
  async getPendingFarms(): Promise<Farm[]> {
    return this.farmRepository.find({
      where: { status: FarmStatus.PENDING },
      relations: ['address'], 
      order: { created: 'DESC' },
    });
  }

  async getFarmById(farmId: string): Promise<Farm> {
    if (!isUUID(farmId)) {
        console.log('Farm ID is not a valid UUID:', farmId);
        throw new NotFoundException('Farm not found');
      }
    const farm = await this.farmRepository.findOne({ where: { farm_id: farmId } });
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
      throw new NotFoundException('Farm not found');
    }
  
    const farm = await this.farmRepository.findOne({ where: { farm_id: farmId } });
    if (!farm) throw new NotFoundException('Farm not found');
  
    farm.status = dto.status;
    farm.updated = new Date(); 
    await this.farmRepository.save(farm);
  
    const approveDetail = this.approveDetailRepository.create({
      action: dto.status,
      reason: dto.reason || `${dto.status} by admin ${adminId}`,
      admin_id: adminId,
      created: new Date(),
      updated: new Date(),
      farm: farm,
    });
    await this.approveDetailRepository.save(approveDetail);
  
    return farm;
  }
}
