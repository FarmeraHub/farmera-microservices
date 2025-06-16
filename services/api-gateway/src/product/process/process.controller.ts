import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProcessService } from './process.service';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateProcessDto } from './dto/create-process.dto';
import { SimpleCursorPagination } from 'src/common/dto/pagination.dto';

@Controller('process')
export class ProcessController {

    constructor(private readonly processService: ProcessService) { }

    @Post()
    async createProcess(@User() user: UserInterface, @Body() createProcessDto: CreateProcessDto) {
        return await this.processService.createProcess(user.id, createProcessDto);
    }

    @Get("product/:process_id")
    async getProcesses(@Param("process_id") processId: number, @Query() pagination?: SimpleCursorPagination) {
        return await this.processService.getProcesses(processId, pagination);
    }

    @Get(":process_id")
    async getProcess(@Param("process_id") processId: number) {
        return await this.processService.getProcess(processId);
    }
}
