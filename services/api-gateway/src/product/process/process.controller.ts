import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProcessService } from './process.service';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateProcessDto } from './dto/create-process.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { SimpleCursorPagination } from 'src/pagination/dto/pagination-options.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { Process } from './entities/process.entity';

@ApiTags('Process')
@Controller('process')
export class ProcessController {

    constructor(private readonly processService: ProcessService) { }

    @Post()
    @ApiOperation({ summary: 'Create a process', description: 'Creates a new process for a product.' })
    @ApiBody({ type: CreateProcessDto })
    @ApiResponse({ status: 201, description: 'Process created successfully', type: Process })
    @ApiBadRequestResponse({ description: 'Invalid input or creation failed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async createProcess(@User() user: UserInterface, @Body() createProcessDto: CreateProcessDto) {
        return await this.processService.createProcess(user.id, createProcessDto);
    }

    @Public()
    @Get("product/:process_id")
    @ApiOperation({ summary: 'Get processes for a product', description: 'Retrieves all processes for a product.' })
    @ApiParam({ name: 'process_id', description: 'ID of the product' })
    @ApiQuery({ name: 'next_cursor', required: false, type: String })
    @ApiResponse({ status: 200, description: 'List of processes', type: [Process] })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async getProcesses(@Param("process_id") processId: number, @Query() pagination?: SimpleCursorPagination) {
        return await this.processService.getProcesses(processId, pagination);
    }

    @Public()
    @Get(":process_id")
    @ApiOperation({ summary: 'Get process by ID', description: 'Retrieves a process by its ID.' })
    @ApiParam({ name: 'process_id', description: 'ID of the process' })
    @ApiResponse({ status: 200, description: 'Process retrieved successfully', type: Process })
    @ApiNotFoundResponse({ description: 'Process not found' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async getProcess(@Param("process_id") processId: number) {
        return await this.processService.getProcess(processId);
    }
}
