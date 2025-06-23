export class CancelDeliveryDto {
    order_codes: string[];
}

export interface GhnCancelDeliveryDto {
    order_code: string;
    result: string;
    message: string;
}
export interface GhnCancelResponseDto {
    code: number;
    message: string;
    data: GhnCancelDeliveryDto[];
    code_message?: string;
}