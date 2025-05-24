import { Column, Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn } from 'typeorm';
import { FarmStatus } from '../../../common/enums/farm-status.enum';
import { Farm } from 'src/farms/entities/farm.entity';

@Entity()
export class ApproveDetail {
    @PrimaryGeneratedColumn('uuid')
    id: string; 

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
