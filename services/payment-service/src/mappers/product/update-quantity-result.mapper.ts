import { UpdateQuantityResult as GrpcUpdateQuantityResult } from "@farmera/grpc-proto/dist/products/products";
export class UpdateQuantityResultMapper {
    static fromGrpcUpdateQuantityResult(value: GrpcUpdateQuantityResult): UpdateQuantityResult | undefined {

        if (!value) return undefined;
        const result: UpdateQuantityResult = {
            product_id: value.product_id,
            success: value.success,
            message: value.message,

        };
        if (value.previous_quantity !== undefined) {
            result.previous_quantity = value.previous_quantity;
        }
        if (value.new_quantity !== undefined) {
            result.new_quantity = value.new_quantity;
        }
        return result;
    }
}
