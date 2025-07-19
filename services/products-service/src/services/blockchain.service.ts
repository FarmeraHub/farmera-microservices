import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { ethers } from 'ethers';
import * as geohash from 'ngeohash';
import { Process } from 'src/process/entities/process.entity';
import { Product } from 'src/products/entities/product.entity';

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
  verification_date: Date;
}

export interface BlockChainProduct {
  dataHash: string,
  productId: bigint,
  timestamp: bigint;
  location: bigint;
}

export interface TraceabilityData {
  product: Product;
  process: Process;
  latitude: number;
  longitude: number;
}

@Injectable()
export class BlockchainService {

  private readonly logger = new Logger(BlockchainService.name);

  private readonly provider: ethers.JsonRpcProvider;
  private readonly contract: ethers.Contract;
  private readonly wallet: ethers.Wallet;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.provider = new ethers.JsonRpcProvider(this.configService.get<string>('SEPOLIA_RPC_URL'));
    const walletKey = this.configService.get<string>('WALLET_PRIVATE_KEY');
    if (!walletKey) {
      throw new BadRequestException('WALLET_PRIVATE_KEY is not defined in environment variables');
    }
    this.wallet = new ethers.Wallet(walletKey, this.provider);
    const contractAddress = this.configService.get<string>("CONTRACT_ADDRESS");
    if (!contractAddress) {
      throw new BadRequestException('CONTRACT_ADDRESS is not defined in environment variables');
    }
    // this.contract = new ethers.Contract(contractAddress, PROCESS_TRACKING_ABI, this.wallet);
    this.contract = new ethers.Contract(contractAddress, PRODUCT_TRACKING_ABI, this.wallet);
  }

  async addProduct(traceabilityData: TraceabilityData) {
    try {
      const blockchainData = this.createTraceabilityPayload(traceabilityData);

      const dataHash = createHash('sha256')
        .update(JSON.stringify(blockchainData))
        .digest('hex');

      const geoHash = geohash.encode_int(
        traceabilityData.latitude,
        traceabilityData.longitude,
        BIT_DEPTH,
      );

      // Add to blockchain
      const result = await this.contract.addProduct(
        blockchainData.product.product_id,
        Math.floor(new Date().getTime() / 1000),
        geoHash,
        dataHash,
      );

      return result.hash;

    } catch (error) {
      this.logger.error(`Error adding product ${traceabilityData.product.product_id}`);
      throw error;
    }
  }

  async verifyProductTraceability(
    traceabilityData: { product: Product, process: Process }
  ): Promise<VerificationResult> {
    try {
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
          verification_date: new Date()
        };
      }

      return {
        isValid: true,
        verification_date: new Date()
      };
    } catch (error) {
      this.logger.error(
        `Error verifying traceability for product ${traceabilityData.product.product_id}: ${error}`,
      );
      return {
        isValid: false,
        error: error.message,
        verification_date: new Date()
      };
    }
  }

  async getProduct(productId: number): Promise<BlockChainProduct> {
    try {
      const result = await this.contract.getProduct(productId);

      // Parse the result
      const product: BlockChainProduct = {
        dataHash: result[0],
        productId: result[1],
        timestamp: result[2],
        location: result[3],
      };

      if (product.productId === 0n) {
        throw new BadRequestException(`Product ${productId} not found on blockchain`);
      }

      return product;

    } catch (error) {
      this.logger.error(`Error getting product ${productId}: ${error}`);
      throw error;
    }
  }

  private createTraceabilityPayload(traceabilityData: { product: Product, process: Process }) {
    const { product, process } = traceabilityData;

    return {
      product: {
        product_id: product.product_id,
        product_name: product.product_name,
        description: product.description,
        farm_id: product.farm?.farm_id,
        farm_name: product.farm?.farm_name,
        created: product.created,
      },
      process: process,
    };
  }
}