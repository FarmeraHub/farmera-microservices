import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diary } from './entities/diary.entity';
import { Process } from '../process/entities/process.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    @InjectRepository(Process)
    private readonly processRepository: Repository<Process>,
  ) {}

  async create(createDiaryDto: CreateDiaryDto, userId: string): Promise<Diary> {
    // Verify process exists and belongs to user's farm
    const process = await this.processRepository.findOne({
      where: { process_id: createDiaryDto.process_id },
      relations: ['product', 'product.farm'],
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (process.product?.farm?.user_id !== userId) {
      throw new BadRequestException(
        'You can only add diary entries to your own products',
      );
    }

    const diary = this.diaryRepository.create({
      ...createDiaryDto,
      process,
      recorded_date: new Date(createDiaryDto.recorded_date),
    });

    return await this.diaryRepository.save(diary);
  }

  async findByProcessId(processId: number): Promise<Diary[]> {
    return await this.diaryRepository.find({
      where: { process: { process_id: processId } },
      order: { recorded_date: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Diary> {
    const diary = await this.diaryRepository.findOne({
      where: { diary_id: id },
      relations: ['process', 'process.product', 'process.product.farm'],
    });

    if (!diary) {
      throw new NotFoundException('Diary entry not found');
    }

    return diary;
  }

  async update(updateDiaryDto: UpdateDiaryDto, userId: string): Promise<Diary> {
    const diary = await this.findOne(updateDiaryDto.diary_id);

    // Verify ownership
    if (diary.process?.product?.farm?.user_id !== userId) {
      throw new BadRequestException(
        'You can only update your own diary entries',
      );
    }

    const updateData = { ...updateDiaryDto };
    if (updateData.recorded_date) {
      updateData.recorded_date = new Date(updateData.recorded_date) as any;
    }

    await this.diaryRepository.update(updateDiaryDto.diary_id, updateData);
    return await this.findOne(updateDiaryDto.diary_id);
  }

  async remove(id: number, userId: string): Promise<boolean> {
    const diary = await this.findOne(id);

    // Verify ownership
    if (diary.process?.product?.farm?.user_id !== userId) {
      throw new BadRequestException(
        'You can only delete your own diary entries',
      );
    }

    await this.diaryRepository.delete(id);
    return true;
  }
}
