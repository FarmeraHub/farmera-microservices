import { map } from 'rxjs';
import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { Farm } from './../farms/entities/farm.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, In, Not, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import {
  ProductStatus,
  ProductStatusOrder,
} from 'src/common/enums/product-status.enum';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMeta } from 'src/pagination/dto/pagination-meta.dto';
import { ProductOptions } from './dto/product-options.dto';
import { AzureBlobService } from 'src/services/azure-blob.service';
import { Process } from 'src/process/entities/process.entity';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { ProcessStage } from 'src/common/enums/process-stage.enum';
import { UpdateProductQuantityOperation } from 'src/common/enums/update-product-quantity-operation.enum';
import { ProductProcessAssignment } from 'src/process/entities/product-process-assignment.entity';
import { StepDiaryEntry } from 'src/diary/entities/step-diary-entry.entity';
import {
  BlockchainService,
  TraceabilityData,
} from 'src/services/blockchain.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  private appUrl: string; // use for generating QR code deep link

  onModuleInit() {
    const appUrl = this.configService.get<string>('APP_URL');
    if (!appUrl) {
      throw new Error('APP_URL environment variable is not defined');
    }
    this.appUrl = appUrl;
  }

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(Process)
    private readonly processRepository: Repository<Process>,
    @InjectRepository(ProductProcessAssignment)
    private readonly assignmentRepository: Repository<ProductProcessAssignment>,
    @InjectRepository(StepDiaryEntry)
    private readonly stepDiaryRepository: Repository<StepDiaryEntry>,
    private readonly fileStorageService: AzureBlobService,
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly blockchainService: BlockchainService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    const existedFarm = await this.farmRepository.findOne({
      where: { user_id: userId },
    });

    if (!existedFarm) {
      throw new NotFoundException('Farm không tồn tại');
    }
    // if ('status' in existedFarm && existedFarm.status !== FarmStatus.APPROVED) {
    //   throw new BadRequestException('Farm chưa được duyệt');
    // }

    try {
      const { subcategory_ids, ...temp_product } = createProductDto;

      const product = this.productsRepository.create(temp_product);
      product.farm = existedFarm;

      if (subcategory_ids && subcategory_ids.length > 0) {
        const subcategories = await this.subcategoryRepository.find({
          where: { subcategory_id: In(subcategory_ids) },
        });
        if (subcategories.length !== subcategory_ids.length) {
          throw new NotFoundException('Không tìm thấy subcategory');
        }
        product.subcategories = subcategories;
      }

      const result = await this.productsRepository.save(product);
      const { farm, ...rest } = result;
      return rest;
    } catch (error) {
      this.logger.error(error.message);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException(
        `Không thể tạo sản phẩm: ${error.message}`,
      );
    }
  }

  async deleteProduct(productId: number, userId: string): Promise<boolean> {
    const farm = await this.farmRepository.findOne({
      select: ['status', 'user_id'],
      where: { user_id: userId },
    });
    if (!farm) {
      throw new NotFoundException('Farm không tồn tại');
    }

    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
      relations: ['farm'],
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    if (!product.farm || product.farm.user_id !== farm.user_id) {
      throw new UnauthorizedException('Bạn không có quyền xoá sản phẩm này');
    }

    try {
      const deleteResult = await this.productsRepository.update(
        { product_id: product.product_id },
        { status: ProductStatus.DELETED },
      );

      if (deleteResult.affected === 0) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm ID ${productId} để xóa trong transaction.`,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error.message);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Không thể xoá sản phẩm: ${error.message}`,
      );
    }
  }

  async updateProduct(
    productId: number,
    updateProductDto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    try {
      const userFarm = await this.farmRepository.findOne({
        select: ['user_id'],
        where: { user_id: userId },
      });
      if (!userFarm) {
        throw new NotFoundException('Farm của người dùng không tồn tại');
      }

      const product = await this.productsRepository.findOne({
        where: { product_id: productId },
        relations: ['farm'],
      });

      if (!product) {
        throw new NotFoundException(`Sản phẩm ID ${productId} không tồn tại`);
      }

      if (!product.farm || product.farm.user_id !== userFarm.user_id) {
        throw new UnauthorizedException(
          'Bạn không có quyền chỉnh sửa sản phẩm này',
        );
      }

      const deleteImgUrls = product.image_urls?.filter(
        (value) => !updateProductDto.image_urls?.includes(value),
      );
      const deleteVideoUrls = product.video_urls?.filter(
        (value) => !updateProductDto.video_urls?.includes(value),
      );

      const failedDeletes: string[] = [];
      // delete images
      if (deleteImgUrls?.length) {
        const imgResults = await Promise.allSettled(
          deleteImgUrls.map((url) => this.fileStorageService.deleteFile(url)),
        );

        imgResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            this.logger.error(
              `Failed to delete image: ${deleteImgUrls[index]}`,
            );
            failedDeletes.push(deleteImgUrls[index]);
          }
        });
      }

      // delete videos
      if (deleteVideoUrls?.length) {
        const videoResults = await Promise.allSettled(
          deleteVideoUrls.map((url) => this.fileStorageService.deleteFile(url)),
        );

        videoResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            this.logger.error(
              `Failed to delete video: ${deleteVideoUrls[index]}`,
            );
            failedDeletes.push(deleteVideoUrls[index]);
          }
        });
      }

      const updateProduct = { ...product, ...updateProductDto };

      updateProduct.image_urls = updateProductDto.image_urls
        ? updateProductDto.image_urls
        : null;
      updateProduct.video_urls = updateProductDto.video_urls
        ? updateProductDto.video_urls
        : null;

      const result = await this.productsRepository.save(updateProduct);
      const { farm, ...rest } = result;
      return rest;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof UnauthorizedException
      )
        throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể cập nhật sản phẩm');
    }
  }

  async searchAndFilterProducts(
    paginationOptions: PaginationOptions,
    filters?: {
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      maxRating?: number;
      minTotalSold?: number;
      status?: ProductStatus;
      subCategoryId?: number;
      isCategory?: boolean;
    },
    productOptions?: ProductOptions,
  ): Promise<PaginationResult<Product>> {
    try {
      const queryBuilder =
        this.productsRepository.createQueryBuilder('product');
      if (productOptions?.include_farm)
        queryBuilder.leftJoinAndSelect('product.farm', 'farm');
      if (productOptions?.include_categories) {
        queryBuilder.leftJoinAndSelect('product.subcategories', 'subcategory');
      } else {
        queryBuilder.leftJoin('product.subcategories', 'subcategory');
      }

      // Apply filters
      if (filters?.subCategoryId != undefined) {
        const id = filters.subCategoryId;
        if (filters?.isCategory) {
          queryBuilder
            .leftJoin('subcategory.category', 'category')
            .andWhere('category.category_id = :id', { id });
        } else {
          queryBuilder.andWhere('subcategory.subcategory_id = :id', { id });
        }
      }

      if (filters?.search?.trim()) {
        queryBuilder.andWhere('("product"."product_name" ILIKE :search)', {
          search: `%${filters.search.trim()}%`,
        });
      }

      if (filters?.minPrice !== undefined) {
        queryBuilder.andWhere('product.price_per_unit >= :minPrice', {
          minPrice: filters.minPrice,
        });
      }

      if (filters?.maxPrice !== undefined) {
        queryBuilder.andWhere('product.price_per_unit <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      }

      if (filters?.minRating !== undefined) {
        queryBuilder.andWhere('product.average_rating >= :minRating', {
          minRating: filters.minRating,
        });
      }

      if (filters?.maxRating !== undefined) {
        queryBuilder.andWhere('product.average_rating <= :maxRating', {
          maxRating: filters.maxRating,
        });
      }

      if (filters?.status != undefined) {
        queryBuilder.andWhere('product.status = :status', {
          status: filters.status,
        });
      } else {
        queryBuilder.andWhere('product.status IN (:...allowedStatuses)', {
          allowedStatuses: [
            ProductStatus.PRE_ORDER,
            ProductStatus.NOT_YET_OPEN,
            ProductStatus.OPEN_FOR_SALE,
            ProductStatus.SOLD_OUT,
          ],
        });
      }

      // Add sorting
      if (paginationOptions.sort_by) {
        const validSortValue = [
          'created',
          'product_name',
          'status',
          'price',
          'average_rating',
          'total_sold',
        ];
        if (!validSortValue.includes(paginationOptions.sort_by)) {
          throw new BadRequestException('Cột sắp xếp không hợp lệ.');
        }

        const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
        switch (paginationOptions.sort_by) {
          case 'created':
            queryBuilder.orderBy('product.product_id', order);
            break;
          case 'product_name':
            queryBuilder.orderBy('product.product_name', order);
            break;
          case 'status':
            queryBuilder.orderBy('product.status', order);
            break;
          case 'price':
            queryBuilder.orderBy('product.price_per_unit', order);
            break;
          case 'average_rating':
            queryBuilder.orderBy('product.average_rating', order);
            break;
          case 'total_sold':
            queryBuilder.orderBy('product.total_sold', order);
            break;
          default:
            queryBuilder.orderBy('product.product_id', 'DESC');
        }
      } else {
        queryBuilder.orderBy(
          'product.product_id',
          (paginationOptions.order || 'DESC') as 'ASC' | 'DESC',
        );
      }

      // If all=true, return all results without pagination
      if (paginationOptions.all) {
        const products = await queryBuilder.getMany();
        if (!products || products.length === 0) {
          this.logger.error('Không tìm thấy danh mục nào.');
          throw new NotFoundException('Không tìm thấy danh mục nào.');
        }
        return new PaginationResult(products);
      }

      // Apply pagination
      const totalItems = await queryBuilder.getCount();

      const totalPages = Math.ceil(
        totalItems / (paginationOptions.limit ?? 10),
      );
      const currentPage = paginationOptions.page ?? 1;

      if (totalPages > 0 && currentPage > totalPages) {
        throw new NotFoundException(
          `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
        );
      }

      const products = await queryBuilder
        .skip(paginationOptions.skip)
        .take(paginationOptions.limit)
        .getMany();

      if (!products || products.length === 0) {
        this.logger.error('Không tìm thấy danh mục nào.');
        throw new NotFoundException('Không tìm thấy danh mục nào.');
      }

      const meta = new PaginationMeta({
        paginationOptions,
        totalItems,
      });

      return new PaginationResult(products, meta);
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      )
        throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể tìm kiếm sản phẩm');
    }
  }

  async findProductById(
    productId: number,
    productOptions?: ProductOptions,
  ): Promise<Product> {
    try {
      const relationsToLoads: string[] = [];
      if (productOptions?.include_farm) relationsToLoads.push('farm');
      if (productOptions?.include_categories)
        relationsToLoads.push('subcategories');
      if (productOptions?.include_processes) relationsToLoads.push('processes');

      const product = await this.productsRepository.findOne({
        where: { product_id: productId, status: Not(ProductStatus.DELETED) },
        relations: relationsToLoads,
      });

      if (!product) {
        this.logger.error(
          `(findProductById) Không tìm thấy sản phẩm với ID: ${productId}`,
        );
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }
      return product;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể tìm kiếm sản phẩm');
    }
  }

  async findProductsByIds(
    productIds: number[],
    productOptions?: ProductOptions,
  ): Promise<Product[]> {
    try {
      const relationsToLoads: string[] = [];
      if (productOptions?.include_farm) {
        relationsToLoads.push(
          ...['farm', 'farm.address', 'farm.address.address_ghn'],
        );
      }
      if (productOptions?.include_categories)
        relationsToLoads.push('subcategories');
      if (productOptions?.include_processes) relationsToLoads.push('processes');

      this.logger.log(
        `(relationsToLoads) Đang tải các quan hệ: ${relationsToLoads.join(', ')}`,
      );
      const products = await this.productsRepository.find({
        where: {
          product_id: In(productIds),
          status: Not(ProductStatus.DELETED),
        },
        relations: relationsToLoads,
      });

      if (!products || products.length === 0) {
        this.logger.error(
          `(findProductsByIds) Không tìm thấy sản phẩm với ID: ${productIds.join(', ')}`,
        );
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }
      this.logger.log(
        `(findProductsByIds) Tìm thấy ${products.length} sản phẩm với ID: ${productIds.join(', ')}`,
      );
      //this.logger.log(`(Products) ${JSON.stringify(products, null, 2)}`);
      return products;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể tìm kiếm sản phẩm');
    }
  }

  async findProductsByFarmId(
    farmId: string,
    productOptions?: ProductOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginationResult<Product>> {
    try {
      if (!paginationOptions) {
        const relationsToLoads: string[] = [];
        if (productOptions?.include_categories)
          relationsToLoads.push('subcategories');

        const products = await this.productsRepository.find({
          where: {
            farm: { farm_id: farmId },
            status: Not(ProductStatus.DELETED),
          },
          relations: relationsToLoads,
        });

        if (products.length === 0) {
          this.logger.error(
            `(findProductsByFarmId) Không tìm thấy sản phẩm nào cho farm ID: ${farmId}`,
          );
          throw new NotFoundException(
            `Không tìm thấy sản phẩm nào cho farm ID: ${farmId}`,
          );
        }
        return new PaginationResult(products);
      }

      // Use pagination
      const qb = this.productsRepository
        .createQueryBuilder('product')
        .where('product.farm_id = :farmId', { farmId })
        .andWhere('product.status != :deletedStatus', {
          deletedStatus: ProductStatus.DELETED,
        });

      if (productOptions?.include_categories)
        qb.leftJoinAndSelect('product.subcategories', 'subcategory');

      // Add sorting if specified
      if (paginationOptions.sort_by) {
        const validSortValue = [
          'created',
          'product_name',
          'status',
          'price',
          'average_rating',
          'total_sold',
        ];
        if (!validSortValue.includes(paginationOptions.sort_by)) {
          throw new BadRequestException('Cột sắp xếp không hợp lệ.');
        }

        const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
        switch (paginationOptions.sort_by) {
          case 'created':
            qb.orderBy('product.product_id', order);
            break;
          case 'product_name':
            qb.orderBy('product.product_name', order);
            break;
          case 'status':
            qb.orderBy('product.status', order);
            break;
          case 'price':
            qb.orderBy('product.price_per_unit', order);
            break;
          case 'average_rating':
            qb.orderBy('product.average_rating', order);
            break;
          case 'total_sold':
            qb.orderBy('product.total_sold', order);
            break;
          default:
            qb.orderBy('product.product_id', 'DESC');
        }
      } else {
        qb.orderBy(
          'product.product_id',
          (paginationOptions.order || 'DESC') as 'ASC' | 'DESC',
        );
      }

      // If all=true, return all results without pagination
      if (paginationOptions.all) {
        const products = await qb.getMany();
        if (!products || products.length === 0) {
          this.logger.error('Không tìm thấy danh mục nào.');
          throw new NotFoundException('Không tìm thấy danh mục nào.');
        }
        return new PaginationResult(products);
      }

      // Apply pagination
      const totalItems = await qb.getCount();

      const totalPages = Math.ceil(
        totalItems / (paginationOptions.limit ?? 10),
      );
      const currentPage = paginationOptions.page ?? 1;

      if (totalPages > 0 && currentPage > totalPages) {
        throw new NotFoundException(
          `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
        );
      }

      const products = await qb
        .skip(paginationOptions.skip)
        .take(paginationOptions.limit)
        .getMany();

      if (!products || products.length === 0) {
        this.logger.error('Không tìm thấy danh mục nào.');
        throw new NotFoundException('Không tìm thấy danh mục nào.');
      }

      const meta = new PaginationMeta({
        paginationOptions,
        totalItems,
      });

      return new PaginationResult(products, meta);
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể tìm kiếm sản phẩm');
    }
  }

  async findProductsByCategory(
    id: number,
    isCategory: boolean,
    productOptions?: ProductOptions,
    paginationOptions?: PaginationOptions,
  ): Promise<PaginationResult<Product>> {
    try {
      const qb = this.productsRepository.createQueryBuilder('product');

      if (productOptions?.include_categories) {
        qb.leftJoinAndSelect('product.subcategories', 'subcategory');
      } else {
        qb.leftJoin('product.subcategories', 'subcategory');
      }

      qb.andWhere('product.status != :deletedStatus', {
        deletedStatus: ProductStatus.DELETED,
      });

      if (isCategory) {
        qb.leftJoin('subcategory.category', 'category').andWhere(
          'category.category_id = :id',
          { id },
        );
      } else {
        qb.andWhere('subcategory.subcategory_id = :id', { id });
      }

      if (!paginationOptions) {
        const products = await qb.getMany();
        if (!products || products.length === 0) {
          this.logger.error('Không tìm thấy danh mục nào.');
          throw new NotFoundException('Không tìm thấy danh mục nào.');
        }
        return new PaginationResult(products);
      }

      // Add sorting if specified
      if (paginationOptions.sort_by) {
        const validSortValue = [
          'created',
          'product_name',
          'status',
          'price',
          'average_rating',
          'total_sold',
        ];
        if (!validSortValue.includes(paginationOptions.sort_by)) {
          throw new BadRequestException('Cột sắp xếp không hợp lệ.');
        }

        const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
        switch (paginationOptions.sort_by) {
          case 'created':
            qb.orderBy('product.product_id', order);
            break;
          case 'product_name':
            qb.orderBy('product.product_name', order);
            break;
          case 'status':
            qb.orderBy('product.status', order);
            break;
          case 'price':
            qb.orderBy('product.price_per_unit', order);
            break;
          case 'average_rating':
            qb.orderBy('product.average_rating', order);
            break;
          case 'total_sold':
            qb.orderBy('product.total_sold', order);
            break;
          default:
            qb.orderBy('product.product_id', 'DESC');
        }
      } else {
        qb.orderBy(
          'product.product_id',
          (paginationOptions.order || 'DESC') as 'ASC' | 'DESC',
        );
      }

      // If all=true, return all results without pagination
      if (paginationOptions.all) {
        const products = await qb.getMany();
        if (!products || products.length === 0) {
          this.logger.error('Không tìm thấy danh mục nào.');
          throw new NotFoundException('Không tìm thấy danh mục nào.');
        }
        return new PaginationResult(products);
      }

      // Apply pagination
      const totalItems = await qb.getCount();

      const totalPages = Math.ceil(
        totalItems / (paginationOptions.limit ?? 10),
      );
      const currentPage = paginationOptions.page ?? 1;

      if (totalPages > 0 && currentPage > totalPages) {
        throw new NotFoundException(
          `Không tìm thấy dữ liệu ở trang ${currentPage}.`,
        );
      }

      const products = await qb
        .skip(paginationOptions.skip)
        .take(paginationOptions.limit)
        .getMany();

      if (!products || products.length === 0) {
        this.logger.error('Không tìm thấy danh mục nào.');
        throw new NotFoundException('Không tìm thấy danh mục nào.');
      }

      const meta = new PaginationMeta({
        paginationOptions,
        totalItems,
      });

      return new PaginationResult(products, meta);
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof BadRequestException
      )
        throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể tìm kiếm sản phẩm');
    }
  }

  async updateProductStatus(
    userId: string,
    productId: number,
    newStatus: ProductStatus,
  ): Promise<boolean> {
    try {
      // check valid status
      const validStatus = [
        ProductStatus.PRE_ORDER,
        ProductStatus.SOLD_OUT,
        ProductStatus.CLOSED,
        ProductStatus.DELETED,
      ];
      if (!validStatus.includes(newStatus))
        throw new BadRequestException('Trạng thái cập nhật không hợp lệ');

      // check valid user
      if (!(await this.isProductUserValid(userId, productId)))
        throw new UnauthorizedException(
          'Người dùng không có quyền thao tác trên sản phẩm',
        );

      // update status
      const productCurrentStatus = await this.productsRepository.findOne({
        where: { product_id: productId },
        select: ['status'],
      });
      if (!productCurrentStatus)
        throw new NotFoundException(
          `Không tìm thấy sản phẩm ID: ${productId}.`,
        );
      if (
        ProductStatusOrder[productCurrentStatus.status] >
        ProductStatusOrder[newStatus]
      )
        throw new BadRequestException('Trạng thái không hợp lệ');

      const result = await this.productsRepository.update(
        { product_id: productId },
        { status: newStatus },
      );
      if (result.affected === 0) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm ID: ${productId}.`,
        );
      }
      return true;
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      )
        throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException(
        'Không thể cập nhật trạng thái sản phẩm',
      );
    }
  }

  async openProductForSale(userId: string, productId: number): Promise<string> {
    try {
      // check valid user
      if (!(await this.isProductUserValid(userId, productId)))
        throw new UnauthorizedException(
          'Người dùng không có quyền thao tác trên sản phẩm',
        );

      // validate product processes
      if (!(await this.validProductProcess(productId)))
        throw new BadRequestException(
          'Quy trình sản xuất của sản phẩm không hợp lệ',
        );

      // generate QR code
      const deepLink = `${this.appUrl}/redirect/product/${productId}`;
      const qrCode = await QRCode.toDataURL(deepLink);

      // update open for sale if the processes is valid
      const result = await this.productsRepository.update(
        { product_id: productId },
        { status: ProductStatus.OPEN_FOR_SALE },
      );
      if (result.affected === 0) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm ID: ${productId}.`,
        );
      }
      return qrCode;
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      )
        throw err;
      this.logger.error(err.message);
      throw new InternalServerErrorException('Không thể mở bán sản phẩm');
    }
  }

  private async validProductProcess(productId: number): Promise<boolean> {
    const stages = await this.processRepository.find({
      where: { product: { product_id: productId } },
      select: ['stage_name'],
    });
    const hasStart = stages.some((p) => p.stage_name === ProcessStage.START);
    const hasProduction = stages.some(
      (p) => p.stage_name === ProcessStage.PRODUCTION,
    );
    const hasCompletion = stages.some(
      (p) => p.stage_name === ProcessStage.COMPLETION,
    );

    return hasStart && hasProduction && hasCompletion;
  }

  private async isProductUserValid(
    userId: string,
    productId: number,
  ): Promise<boolean> {
    const validUser = await this.productsRepository.exists({
      where: { farm: { user_id: userId }, product_id: productId },
    });
    if (!validUser) return false;
    return true;
  }

  async generateQRCode(
    productId: number,
    userId: string,
  ): Promise<{ qr_code: string }> {
    // Verify product ownership
    const isValid = await this.isProductUserValid(userId, productId);
    if (!isValid) {
      throw new UnauthorizedException(
        'Bạn không có quyền tạo QR cho sản phẩm này',
      );
    }

    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    try {
      // Generate deep link URL for the product
      const deepLinkUrl = `${this.appUrl}/detail/${productId}`;

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(deepLinkUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Update product with QR code
      await this.productsRepository.update(productId, {
        qr_code: qrCodeDataUrl,
      });

      return { qr_code: qrCodeDataUrl };
    } catch (error) {
      this.logger.error(`QR Code generation failed: ${error.message}`);
      throw new InternalServerErrorException('Không thể tạo mã QR');
    }
  }

  async activateBlockchain(
    productId: number,
    userId: string,
  ): Promise<{ blockchain_hash: string; success: boolean }> {
    // Verify product ownership
    const isValid = await this.isProductUserValid(userId, productId);
    if (!isValid) {
      throw new UnauthorizedException(
        'Bạn không có quyền kích hoạt blockchain cho sản phẩm này',
      );
    }

    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
      relations: ['farm'],
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    if (product.blockchain_activated) {
      throw new BadRequestException('Sản phẩm đã được kích hoạt blockchain');
    }

    try {
      // Get all process assignments for this product
      const assignments = await this.assignmentRepository.find({
        where: { product: { product_id: productId } },
        relations: ['processTemplate', 'processTemplate.steps'],
      });

      if (!assignments || assignments.length === 0) {
        throw new BadRequestException(
          'Sản phẩm chưa có quy trình sản xuất nào được gán',
        );
      }

      // Get all step diary entries for these assignments
      const stepDiaries = await this.stepDiaryRepository.find({
        where: {
          assignment: {
            assignment_id: In(assignments.map((a) => a.assignment_id)),
          },
        },
        relations: ['assignment', 'step'],
        order: { step_order: 'ASC', recorded_date: 'ASC' },
      });

      // Validate that all required steps are completed
      const incompleteSteps = stepDiaries.filter(
        (diary) => diary.completion_status !== 'COMPLETED',
      );

      if (incompleteSteps.length > 0) {
        const incompleteStepNames = incompleteSteps
          .map((d) => d.step_name)
          .join(', ');
        throw new BadRequestException(
          `Không thể kích hoạt blockchain: còn ${incompleteSteps.length} bước chưa hoàn thành (${incompleteStepNames})`,
        );
      }

      // Validate that all assignments are completed
      const incompleteAssignments = assignments.filter(
        (assignment) => assignment.status !== 'COMPLETED',
      );

      if (incompleteAssignments.length > 0) {
        const incompleteProcessNames = incompleteAssignments
          .map((a) => a.processTemplate.process_name)
          .join(', ');
        throw new BadRequestException(
          `Không thể kích hoạt blockchain: còn ${incompleteAssignments.length} quy trình chưa hoàn thành (${incompleteProcessNames})`,
        );
      }

      // Create traceability data for blockchain
      const traceabilityData: TraceabilityData = {
        product,
        assignments,
        stepDiaries,
      };

      // Add to blockchain using the new service
      const blockchainHash =
        await this.blockchainService.addProductWithTraceability(
          traceabilityData,
        );

      // Update product with blockchain activation
      await this.productsRepository.update(productId, {
        blockchain_activated: true,
        blockchain_hash: blockchainHash,
      });

      this.logger.log(
        `Blockchain activated for product ${productId} with hash: ${blockchainHash}`,
      );

      return {
        blockchain_hash: blockchainHash,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Blockchain activation failed: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Không thể kích hoạt blockchain');
    }
  }

  private generateBlockchainHash(data: any): string {
    // Simple hash generation for demo purposes
    // In production, this would use proper blockchain integration
    const crypto = require('crypto');
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  async getQRCode(productId: number): Promise<{ qr_code: string | null }> {
    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
      select: ['qr_code'],
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    return { qr_code: product.qr_code || null };
  }

  async updateProductQuantity(
    productId: number,
    request_quantity: number,
    operation: UpdateProductQuantityOperation,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const product = await this.productsRepository.findOne({
        where: { product_id: productId },
      });

      if (!product) {
        return {
          success: false,
          message: 'Sản phẩm không tồn tại',
        };
      }

      if (product.status !== ProductStatus.OPEN_FOR_SALE) {
        return {
          success: false,
          message: 'Sản phẩm không thể cập nhật số lượng',
        };
      }

      if (
        operation === UpdateProductQuantityOperation.DECREASE &&
        product.stock_quantity < request_quantity
      ) {
        return {
          success: false,
          message: `Số lượng không đủ. Hiện có: ${product.stock_quantity}, yêu cầu: ${request_quantity}`,
        };
      }

      if (operation === UpdateProductQuantityOperation.INCREASE) {
        product.stock_quantity += request_quantity;
      } else if (operation === UpdateProductQuantityOperation.DECREASE) {
        product.stock_quantity -= request_quantity;
      } else {
        return {
          success: false,
          message: 'Phương thức cập nhật không hợp lệ',
        };
      }

      await this.productsRepository.save(product);

      return {
        success: true,
        message: `Cập nhật số lượng thành công. Số lượng hiện tại: ${product.stock_quantity}`,
      };
    } catch (error) {
      this.logger.error(
        `Cập nhật số lượng sản phẩm thất bại: ${error.message}`,
      );
      return {
        success: false,
        message: 'Lỗi hệ thống khi cập nhật số lượng sản phẩm',
      };
    }
  }
  async updateProductQuantities(
    items: Array<{
      product_id: number;
      request_quantity: number;
      operation: UpdateProductQuantityOperation;
    }>,
  ): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      product_id: number;
      success: boolean;
      message: string;
      previous_quantity?: number;
      new_quantity?: number;
    }>;
  }> {
    if (!items || items.length === 0) {
      return {
        success: false,
        message: 'Danh sách sản phẩm không được rỗng',
        results: [],
      };
    }

    if (items.length > 100) {
      return {
        success: false,
        message: 'Tối đa 100 sản phẩm mỗi lần cập nhật',
        results: [],
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const results: Array<{
        product_id: number;
        success: boolean;
        message: string;
        previous_quantity?: number;
        new_quantity?: number;
      }> = [];
      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        try {
          if (
            item.product_id === undefined ||
            !item.request_quantity ||
            !item.operation
          ) {
            results.push({
              product_id: item.product_id || 0,
              success: false,
              message:
                'Thiếu thông tin bắt buộc: productId, request_quantity, operation',
            });
            failCount++;
            continue;
          }

          if (item.request_quantity <= 0) {
            results.push({
              product_id: item.product_id,
              success: false,
              message: 'Số lượng yêu cầu phải lớn hơn 0',
            });
            failCount++;
            continue;
          }
          const product = await queryRunner.manager.findOne(Product, {
            where: { product_id: item.product_id },
          });

          if (!product) {
            results.push({
              product_id: item.product_id,
              success: false,
              message: 'Sản phẩm không tồn tại',
            });
            failCount++;
            continue;
          }
          if (
            item.operation === UpdateProductQuantityOperation.DECREASE &&
            product.stock_quantity < item.request_quantity
          ) {
            results.push({
              product_id: item.product_id,
              success: false,
              message: `Số lượng không đủ. Hiện có: ${product.stock_quantity}, yêu cầu: ${item.request_quantity}`,
            });
            failCount++;
            continue;
          }

          const previousQuantity = product.stock_quantity;

          if (item.operation === UpdateProductQuantityOperation.INCREASE) {
            product.stock_quantity += item.request_quantity;
          } else if (
            item.operation === UpdateProductQuantityOperation.DECREASE
          ) {
            product.stock_quantity -= item.request_quantity;
          } else {
            results.push({
              product_id: item.product_id,
              success: false,
              message: 'Phương thức cập nhật không hợp lệ',
            });
            failCount++;
            continue;
          }

          await queryRunner.manager.save(Product, product);
          results.push({
            product_id: item.product_id,
            success: true,
            message: `Cập nhật thành công từ ${previousQuantity} thành ${product.stock_quantity}`,
            previous_quantity: previousQuantity,
            new_quantity: product.stock_quantity,
          });
          successCount++;

          this.logger.debug(
            `Product ${item.product_id} updated: ${previousQuantity} -> ${product.stock_quantity}`,
          );
        } catch (error) {
          this.logger.error(
            `Error updating product ${item.product_id}:`,
            error,
          );
          results.push({
            product_id: item.product_id,
            success: false,
            message: `Lỗi hệ thống: ${error.message}`,
          });
          failCount++;
        }
      }

      if (failCount === 0) {
        await queryRunner.commitTransaction();
        this.logger.log(`Successfully updated ${successCount} products`);
        return {
          success: true,
          message: `Cập nhật thành công ${successCount} sản phẩm`,
          results,
        };
      } else {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `Transaction rolled back: ${successCount} success, ${failCount} failed`,
        );
        return {
          success: false,
          message: `Có ${failCount} sản phẩm cập nhật thất bại. Đã hoàn tác tất cả thay đổi.`,
          results,
        };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bulk update products quantity failed:', error);

      return {
        success: false,
        message: `Lỗi hệ thống khi cập nhật hàng loạt: ${error.message}`,
        results: items.map((item) => ({
          product_id: item.product_id || 0,
          success: false,
          message: 'Lỗi hệ thống',
        })),
      };
    } finally {
      await queryRunner.release();
    }
  }

  async getTraceabilityData(productId: number): Promise<TraceabilityData> {
    // Check if product exists
    const product = await this.productsRepository.findOne({
      where: { product_id: productId, status: Not(ProductStatus.DELETED) },
      relations: ['farm'],
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Get all process assignments for this product
    const assignments = await this.assignmentRepository.find({
      where: { product: { product_id: productId } },
      relations: ['processTemplate', 'processTemplate.steps'],
      order: { assigned_date: 'ASC' },
    });

    // Get all step diary entries for these assignments
    const assignmentIds = assignments.map((a) => a.assignment_id);
    const stepDiaries =
      assignmentIds.length > 0
        ? await this.stepDiaryRepository.find({
            where: {
              assignment: { assignment_id: In(assignmentIds) },
            },
            relations: ['assignment', 'step'],
            order: { step_order: 'ASC', recorded_date: 'ASC' },
          })
        : [];

    return {
      product,
      assignments,
      stepDiaries,
    };
  }

  async verifyProductTraceability(productId: number): Promise<{
    isValid: boolean;
    error?: string;
    verificationDate: Date;
  }> {
    try {
      // Get traceability data
      const traceabilityData = await this.getTraceabilityData(productId);

      if (!traceabilityData.product.blockchain_activated) {
        return {
          isValid: false,
          error: 'Sản phẩm chưa được kích hoạt blockchain',
          verificationDate: new Date(),
        };
      }

      // Verify with blockchain
      const verificationResult =
        await this.blockchainService.verifyProductTraceability(
          traceabilityData,
        );

      return {
        isValid: verificationResult.isValid,
        error: verificationResult.error,
        verificationDate: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Traceability verification failed for product ${productId}: ${error.message}`,
      );
      return {
        isValid: false,
        error: 'Không thể xác minh truy xuất nguồn gốc',
        verificationDate: new Date(),
      };
    }
  }
}
