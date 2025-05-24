import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, InternalServerErrorException, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios'; 


@Injectable()
export class ProductClientService {
    private readonly logger = new Logger(ProductClientService.name);

    constructor(private readonly httpService: HttpService) { }



}