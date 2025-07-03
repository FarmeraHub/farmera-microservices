import { Issue } from "src/delivery/enitites/cart.entity";
import { Issue as GrpcIssue } from "@farmera/grpc-proto/dist/payment/payment";

export class IssueMapper { 
    static toGrpcIssue(issue: Issue): GrpcIssue {
            return {
                reason: issue.reason,
                details: issue.details,
                product_id: issue.product_id,
                farm_id: issue.farm_id,
                user_id: issue.user_id,
                address_id: issue.address_id,
            };
        }
}
