import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Farm } from './farm.entity';

export enum IdentificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum IdentificationMethod {
    BIOMETRIC = 'BIOMETRIC',
    ID_CARD = 'ID_CARD',
    PASSPORT = 'PASSPORT',
}

@Entity('identifications')
export class Identification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: IdentificationStatus, default: IdentificationStatus.PENDING })
    status: IdentificationStatus;

    @Column()
    nationality: string;

    @Column({ type: 'enum', enum: IdentificationMethod })
    method: IdentificationMethod;

    @Column({ name: 'id_number' })
    id_number: string;

    @Column({ name: 'full_name' })
    full_name: string;

    @Column({ name: 'id_card_image_url', nullable: true })
    id_card_imageUrl: string;

    @OneToOne(() => Farm, (farm) => farm.identification)
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;
}
