import{Issue as GrpcIssue} from '@farmera/grpc-proto/dist/payment/payment';
import { Issue } from 'src/payment/order/entities/issue.entity';
export class IssueMapper {
    static fromGrpcIssue(value: GrpcIssue): Issue {
        if (!value) return undefined;
        return {
            reason: value.reason,
            details: value.details,
            product_id: value.product_id,
            farm_id: value.farm_id,
            user_id: value.user_id,
            address_id: value.address_id,
        };
    }
}