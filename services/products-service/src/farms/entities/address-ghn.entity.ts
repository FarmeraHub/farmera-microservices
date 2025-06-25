import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Address } from "./address.entity";

@Entity()
export class AddressGHN {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'province_id' })
    province_id: number;

    @Column({ name: 'district_id' })
    district_id: number;

    @Column({ name: 'ward_code' })
    ward_code: string;

    @OneToOne(() => Address, (address) => address.address_ghn, { cascade: true })
    address_ghn: AddressGHN;

}
