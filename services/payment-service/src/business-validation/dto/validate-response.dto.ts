export interface CheckAvailabilityResult {
    isValidOrder: boolean;
    validOrderItems: ValidOrderItem[]; // Chứa thông tin sản phẩm đã được xác thực (id, giá, số lượng, tên farm...)
    issues: IssusesValidation[]; // { reason: string, product_id?: number, farm_id?: string, user_id?: string, details: string }
}

export interface IssusesValidation {
    reason: string; // Lý do không hợp lệ
    product_id?: number; // ID sản phẩm nếu có
    farm_id?: string; // ID farm nếu có
    user_id?: string; // ID người dùng nếu có
    details: string;
    requested_product_id?: number; // ID sản phẩm được yêu cầu nếu có
    requested_quantity?: number; // Số lượng sản phẩm được yêu cầu nếu có
    available_stock?: number; // Số lượng tồn kho hiện có nếu có
}
export interface ValidOrderItem {
    product_id: number; // ID sản phẩm
    farm_id: string; // ID farm
    farm_name: string; // Tên farm
    product_name: string; // Tên sản phẩm
    price_per_unit: number; // Giá mỗi đơn vị
    quantity: number; // Số lượng
    total_price: number; // Tổng giá trị (price_per_unit * quantity)
}

export class OrderDetail {
    user_id: string; 
    payment_method: string; 
    address_id: string;
}