import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Farm } from "./farm.entity";

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  address_id: number;

  @Column()
  city: string;

  @Column()
  district: string;

  @Column()
  ward: string;

  @Column()
  street: string;

  @Column()
  coordinate: string;

  @Column({ nullable: true })
  province: string;

  @CreateDateColumn()
  created: Date;

  @OneToOne(() => Farm, (farm) => farm.address)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;
}