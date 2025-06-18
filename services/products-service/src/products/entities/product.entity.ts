import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Farm } from 'src/farms/entities/farm.entity';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { Process } from 'src/process/entities/process.entity';


@Entity('product')
export class Product {
  @PrimaryGeneratedColumn('increment')
  product_id: number;

  @ManyToOne(() => Farm)
  @JoinColumn({ name: 'farm_id' })
  farm?: Farm;

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

  @Column({ type: 'float' })
  weight: number; // in grams

  @Column({ name: 'total_sold', type: 'int', default: 0 })
  total_sold: number;

  @Column({ name: 'average_rating', type: 'float', default: 0 })
  average_rating: number;

  @Column('text', { array: true, nullable: true })
  image_urls: string[] | null;

  @Column('text', { array: true, nullable: true })
  video_urls: string[] | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.NOT_YET_OPEN,
  })
  status: ProductStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated: Date;

  @ManyToMany(() => Subcategory, (sub) => sub.products, { cascade: true })
  @JoinTable()
  subcategories?: Subcategory[];

  @OneToMany(() => Process, (process) => process.product)
  @JoinColumn({ name: "process_id" })
  processes?: Process[]

  // @Column({ type: 'numeric', precision: 10, scale: 2 })
  // price_per_unit: number; // price for 1 selling unit (e.g 20.000 VND/1kg)

  // @Column({ type: 'text' })
  // unit: string; // kg, g, ml (use "kg" for example)

  // @Column({ type: 'numeric', precision: 10, scale: 2 })
  // sale_unit_quantity: number; // unit per sale pack (e.g 2kg)

  // @Column({ type: 'numeric', precision: 10, scale: 2 })
  // total_sale_price: number; // 20.000 VND/1kg * 2kg = 40.000 VND

  // @Column({ type: 'numeric', precision: 10, scale: 2 })
  // stock_quantity: number; // actual inventory in stock (e.g 10.00kg)

  // @Column({ type: 'int' })
  // available_packs: number; // 10kg / 2kg = 5 packs
}
