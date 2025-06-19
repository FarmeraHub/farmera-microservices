import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    BeforeInsert,
} from 'typeorm';
import { FarmStatus } from '../../../common/enums/farm-status.enum';
import { Farm } from 'src/farms/entities/farm.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity('approve_details')
export class ApproveDetail {
    @PrimaryColumn('uuid')
    id: string;

    @BeforeInsert()
    generateId() {
        if (!this.id) {
            this.id = uuidv4();
        }
    }

    @Column({ type: 'enum', enum: FarmStatus })
    action: FarmStatus;

    @Column({ type: 'text' })
    reason: string;

    @Column()
    created: Date;
    @Column()
    updated: Date;

    @Column({ type: 'uuid' })
    admin_id: string;

    @ManyToOne(() => Farm, { nullable: false })
    @JoinColumn({ name: 'farm_id' })
    farm: Farm;
}
