import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Farm } from "./farm.entity";
import { AddressGHN } from "./address-ghn.entity";

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

  @CreateDateColumn({ type: "timestamptz" })
  created: Date;

  @OneToOne(() => Farm, (farm) => farm.address)
  farm: Farm;

  @OneToOne(() => AddressGHN, (addressGHN) => addressGHN.address_ghn)
  @JoinColumn({ name: 'address_ghn_id' })
  address_ghn: AddressGHN;
}