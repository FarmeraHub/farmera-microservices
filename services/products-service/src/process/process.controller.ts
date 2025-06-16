import { Controller, Get, Post, Headers, Body, Param, Query } from '@nestjs/common';
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { SimpleCursorPagination } from 'src/common/dto/pagination.dto';

@Controller('process')
export class ProcessController {

    constructor(private readonly processService: ProcessService) { }

    // Create a new process
    @Post()
    async createProcess(
        @Headers('x-user-id') userId: string,
        @Body() createProcessDto: CreateProcessDto,
    ) {
        return this.processService.createProcess(createProcessDto, userId);
    }

    // Get all processes
    @Get("product/:id")
    async getProductProcess(@Param("id") productId: number, @Query() pagination: SimpleCursorPagination) {
        return this.processService.getProcesses(
            productId,
            pagination.limit,
            pagination.order,
            pagination.cursor
        );
    }

    // Get process by id
    @Get(":id")
    async getProcess(@Param("id") processId: number) {
        return this.processService.getProcess(processId);
    }

    // Block chain methods
    // @Get("onchain/:id")
    // @UseInterceptors(TransformBigIntInterceptor)
    // async getOnChainProcess(@Param("id") processId: number) {
    //     return this.processService.getOnChainProcess(processId);
    // }

    // @Get("onchain/product/:id")
    // @UseInterceptors(TransformBigIntInterceptor)
    // async getOnChainProductProcessIds(@Param("id") processId: string) {
    //     return this.processService.getOnChainProductProcessIds(processId);
    // }

    // @Get("verified/:id")
    // async getVerifiedProcess(@Param("id") processId: number) {
    //     return this.processService.getVerifiedProcess(processId);
    // }

    // @Get("verified/product/:id")
    // async getVerifiedProcesses(@Param("id") productId: number) {
    //     return this.processService.getVerifiedProcesses(productId);
    // }
}
