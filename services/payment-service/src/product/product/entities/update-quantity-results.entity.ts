interface UpdateQuantityResult {
    product_id: number;
    success: boolean;
    message: string;
    previous_quantity?: number; 
    new_quantity?: number; 
}

interface UpdateQuantitiesResponse {
    success: boolean;
    message: string;
    results: UpdateQuantityResult[];
}
