import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, UpdateDateColumn, OneToMany, JoinColumn, BeforeInsert, PrimaryColumn } from "typeorm";
import { Address } from "./address.entity";
import { FarmStatus } from '../../common/enums/farm-status.enum';
import { Product } from '../../products/entities/product.entity';
import { Identification } from './identification.entity';
import { v4 as uuidv4 } from 'uuid';
import { FarmStats } from "../dto/farm-stats.dto";

@Entity()
export class Farm {
  @PrimaryColumn('uuid')
  farm_id: string;

  @BeforeInsert()
  generateId() {
    if (!this.farm_id) {
      this.farm_id = uuidv4();
    }
  }

  @Column()
  farm_name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column('text', { array: true, nullable: true })
  profile_image_urls: string[];

  @Column('text', { array: true, nullable: true })
  certificate_img_urls: string[];

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  tax_number: string;

  @Column({
    type: 'enum',
    enum: FarmStatus,
    default: FarmStatus.PENDING
  })
  status: FarmStatus;

  @CreateDateColumn({ type: "timestamptz" })
  created: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated: Date;

  @OneToOne(() => Address, (address) => address.farm, { cascade: true })
  @JoinColumn({ name: 'address_id' })
  address: Address;
  @OneToOne(() => Identification, (identification) => identification.farm, { cascade: true })
  identification: Identification;

  @Column('uuid')
  user_id: string;

  @OneToMany(() => Product, (product) => product.farm, { cascade: true })
  products: Product[];

  stats?: FarmStats
}
