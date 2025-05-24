import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Farm } from 'src/farms/entities/farm.entity'; 
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { ProductSubcategoryDetail } from './product-subcategory-detail.entity';


@Entity('product')
export class Product {
  @PrimaryGeneratedColumn('increment')
  product_id: number;

  @ManyToOne(() => Farm)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @Column({ type: 'text' })
  product_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price_per_unit: number;

  @Column({ type: 'text' })
  unit: string;

  @Column({ type: 'int' })
  stock_quantity: number;

  @Column('text', { array: true })
  image_urls: string[];

  @Column('text', { array: true })
  video_urls: string[];

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.NOT_YET_OPEN,
  })
  status: ProductStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated: Date;
  
  @OneToMany(() => ProductSubcategoryDetail, (productSubcategoryDetail) => productSubcategoryDetail.product, { cascade: true })
  productSubcategoryDetails: ProductSubcategoryDetail[];
}
