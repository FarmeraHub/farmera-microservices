import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { ethers } from 'ethers';
import { Process } from 'src/process/entities/process.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductProcessAssignment } from 'src/process/entities/product-process-assignment.entity';
import { StepDiaryEntry } from 'src/diary/entities/step-diary-entry.entity';
import * as geohash from 'ngeohash';

const BIT_DEPTH = 50;

const PROCESS_TRACKING_ABI = [
  'function addProcess(string productId, uint64 processId, uint64 timestamp, uint64 location, string dataHash) external',
  'function getProcess(uint64 processId) external view returns (tuple(string dataHash, uint64 processId, uint64 timestamp, uint64 location) process)',
  'function getProductProcessIds(string productId) external view returns (uint64[] processIds)',
  'event ProcessAdded(string indexed productId, uint64 processId, uint64 timestamp, uint64 location, string dataHash)',
];

const PRODUCT_TRACKING_ABI = [
  'function addProduct(uint64 productId, uint64 timestamp, uint64 location, string dataHash) external',
  'function getProduct(uint64 productId) external view returns (tuple(string dataHash, uint64 productId, uint64 timestamp, uint64 location) product)',
  'event ProductAdded(uint64 indexed productId, uint64 timestamp, uint64 location, string dataHash)',
];

export interface BlockchainProcess {
  dataHash: string;
  processId: bigint;
  timestamp: bigint;
  location: bigint;
}

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export interface BlockChainProduct {
  dataHash: string;
  productId: bigint;
  timestamp: bigint;
  location: bigint;
}

export interface TraceabilityData {
  product: Product;
  assignments: ProductProcessAssignment[];
  stepDiaries: StepDiaryEntry[];
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  private readonly provider: ethers.JsonRpcProvider;
  private readonly contract: ethers.Contract;
  private readonly wallet: ethers.Wallet;

  constructor(private readonly configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('SEPOLIA_RPC_URL'),
    );
    const walletKey = this.configService.get<string>('WALLET_PRIVATE_KEY');
    if (!walletKey) {
      throw new BadRequestException(
        'WALLET_PRIVATE_KEY is not defined in environment variables',
      );
    }
    this.wallet = new ethers.Wallet(walletKey, this.provider);
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    if (!contractAddress) {
      throw new BadRequestException(
        'CONTRACT_ADDRESS is not defined in environment variables',
      );
    }
    // this.contract = new ethers.Contract(contractAddress, PROCESS_TRACKING_ABI, this.wallet);
    this.contract = new ethers.Contract(
      contractAddress,
      PRODUCT_TRACKING_ABI,
      this.wallet,
    );
  }

  async addProductWithTraceability(
    traceabilityData: TraceabilityData,
  ): Promise<string> {
    try {
      this.logger.log(
        `Adding product ${traceabilityData.product.product_id} with traceability data to blockchain`,
      );

      // Create comprehensive traceability data for hashing
      const blockchainData = this.createTraceabilityPayload(traceabilityData);

      // Hash the complete traceability data
      const dataHash = createHash('sha256')
        .update(JSON.stringify(blockchainData))
        .digest('hex');

      // Use product location or default coordinates for geohash
      // TODO: Update with actual farm location fields when available
      const latitude = 0; // Default latitude
      const longitude = 0; // Default longitude
      const geoHash = geohash.encode_int(latitude, longitude, BIT_DEPTH);

      // Add to blockchain
      const result = await this.contract.addProduct(
        traceabilityData.product.product_id,
        Math.floor(new Date().getTime() / 1000),
        geoHash,
        dataHash,
      );

      this.logger.log(`Transaction: ${result.hash}`);
      return result.hash;
    } catch (error) {
      this.logger.error(
        `Error adding product ${traceabilityData.product.product_id} with traceability data: ${error}`,
      );
      throw error;
    }
  }

  async verifyProductTraceability(
    traceabilityData: TraceabilityData,
  ): Promise<VerificationResult> {
    try {
      this.logger.log(
        `Verifying traceability data for product ${traceabilityData.product.product_id}`,
      );

      // Get blockchain data
      const onChainProduct = await this.getProduct(
        traceabilityData.product.product_id,
      );

      // Create current traceability payload
      const currentData = this.createTraceabilityPayload(traceabilityData);
      const currentHash = createHash('sha256')
        .update(JSON.stringify(currentData))
        .digest('hex');

      // Verify data integrity
      if (currentHash !== onChainProduct.dataHash) {
        return {
          isValid: false,
          error: `Traceability data has been modified for product ${traceabilityData.product.product_id}`,
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying traceability for product ${traceabilityData.product.product_id}: ${error}`,
      );
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  private createTraceabilityPayload(traceabilityData: TraceabilityData): any {
    const { product, assignments, stepDiaries } = traceabilityData;

    return {
      product: {
        product_id: product.product_id,
        product_name: product.product_name,
        description: product.description,
        farm_id: product.farm?.farm_id,
        farm_name: product.farm?.farm_name,
        created: product.created,
        blockchain_activated: product.blockchain_activated,
      },
      processAssignments: assignments.map((assignment) => ({
        assignment_id: assignment.assignment_id,
        process_template: {
          process_id: assignment.processTemplate.process_id,
          process_name: assignment.processTemplate.process_name,
          description: assignment.processTemplate.description,
          estimated_duration_days:
            assignment.processTemplate.estimated_duration_days,
        },
        assigned_date: assignment.assigned_date,
        status: assignment.status,
        completion_percentage: assignment.completion_percentage,
        start_date: assignment.start_date,
        target_completion_date: assignment.target_completion_date,
        actual_completion_date: assignment.actual_completion_date,
      })),
      stepDiaries: stepDiaries.map((diary) => ({
        diary_id: diary.diary_id,
        step_name: diary.step_name,
        step_order: diary.step_order,
        notes: diary.notes,
        completion_status: diary.completion_status,
        recorded_date: diary.recorded_date,
        latitude: diary.latitude,
        longitude: diary.longitude,
        weather_conditions: diary.weather_conditions,
        quality_rating: diary.quality_rating,
        issues_encountered: diary.issues_encountered,
        image_urls: diary.image_urls,
        video_urls: diary.video_urls,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  async addProduct(product: BlockChainProduct) {
    try {
      // Add to blockchain
      const result = await this.contract.addProduct(
        product.productId,
        product.timestamp,
        product.dataHash,
        product.dataHash,
      );
      this.logger.log(`Transaction: ${result.hash}`);

      return result.hash;
    } catch (error) {
      this.logger.error(`Error adding product ${product.productId}`);
      throw error;
    }
  }

  async getProduct(productId: number): Promise<BlockChainProduct> {
    try {
      const result = await this.contract.getProcess(productId);

      // Parse the result
      const product: BlockChainProduct = {
        dataHash: result[0],
        productId: result[1],
        timestamp: result[2],
        location: result[3],
      };

      if (product.productId === 0n) {
        throw new BadRequestException(
          `Product ${productId} not found on blockchain`,
        );
      }

      return product;
    } catch (error) {
      this.logger.error(`Error getting product ${productId}: ${error}`);
      throw error;
    }
  }

  // deprecated - keeping for backward compatibility
  async addProcess(process: Process) {
    try {
      this.logger.log(
        `Adding process ${process.process_id} for product ${process.process_id}`,
      );

      // Hash the process data
      const {
        process_id,
        stage_name,
        description,
        image_urls,
        video_urls,
        start_date,
        end_date,
      } = process;
      const product_id = process.product.product_id;
      const processData = {
        process_id,
        product_id,
        stage_name,
        description,
        image_urls,
        video_urls,
        startDate: new Date(start_date).toISOString().split('T')[0],
        endDate: new Date(end_date).toISOString().split('T')[0],
      };
      const dataHash = createHash('sha256')
        .update(JSON.stringify(processData))
        .digest('hex');
      const geoHash = geohash.encode_int(
        process.latitude,
        process.longitude,
        BIT_DEPTH,
      );

      // Add process to blockchain
      const result = await this.contract.addProcess(
        product_id,
        process.process_id,
        Math.floor(process.created.getTime() / 1000),
        geoHash,
        dataHash,
      );
      this.logger.log(`Transaction: ${result.hash}`);

      return result.hash;
    } catch (error) {
      this.logger.error(
        `Error adding process ${process.process_id} for product ${process.product.product_id}: ${error}`,
      );
      throw error;
    }
  }

  // deprecated - keeping for backward compatibility
  async getProcess(processId: number): Promise<BlockchainProcess> {
    try {
      this.logger.log(`Getting process ${processId}`);

      const result = await this.contract.getProcess(processId);

      // Parse the result
      const process: BlockchainProcess = {
        dataHash: result[0],
        processId: result[1],
        timestamp: result[2],
        location: result[3],
      };

      if (process.processId === 0n) {
        throw new BadRequestException(
          `Process ${processId} not found on blockchain`,
        );
      }

      return process;
    } catch (error) {
      this.logger.error(`Error getting process ${processId}: ${error}`);
      throw error;
    }
  }

  // deprecated - keeping for backward compatibility
  async verifyProcess(process: Process): Promise<VerificationResult> {
    try {
      const onChainProcess = await this.getProcess(process.process_id);

      // Hash the process data
      const {
        process_id,
        stage_name,
        description,
        image_urls,
        video_urls,
        start_date,
        end_date,
      } = process;
      const product_id = process.product.product_id;
      const processData = {
        process_id,
        product_id,
        stage_name,
        description,
        image_urls,
        video_urls,
        startDate: new Date(start_date).toISOString().split('T')[0],
        endDate: new Date(end_date).toISOString().split('T')[0],
      };
      const dataHash = createHash('sha256')
        .update(JSON.stringify(processData))
        .digest('hex');
      const geoHash = geohash.encode_int(
        process.latitude,
        process.longitude,
        BIT_DEPTH,
      );

      // Verify the process data
      if (dataHash !== onChainProcess.dataHash) {
        return {
          isValid: false,
          error: `Data hash mismatch for process ${process_id}`,
        };
      }

      if (geoHash !== Number(onChainProcess.location)) {
        return {
          isValid: false,
          error: `Location mismatch for process ${process_id}`,
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      this.logger.error(
        `Error verifying process ${process.process_id}: ${error}`,
      );
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  // deprecated
  async getProductProcessIds(productId: string): Promise<bigint[]> {
    try {
      this.logger.log(`Getting process ids for product ${productId}`);

      const result = await this.contract.getProductProcessIds(productId);

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting process ids for product ${productId}: ${error}`,
      );
      throw error;
    }
  }
}
