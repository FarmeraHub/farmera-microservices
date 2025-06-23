import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

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

    @OneToOne(() => AddressGHN, (addressGHN) => addressGHN.id, { cascade: true })
    address_ghn: AddressGHN;

}
