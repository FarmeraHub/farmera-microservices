import {
    GetListProductsRequest,
    GetListProductsResponse
 } from '@farmera/grpc-proto/dist/products/products';
import { Observable } from 'rxjs';

export interface IProductsGrpcService {
   
   getListProducts(request: GetListProductsRequest): Observable<GetListProductsResponse>;


}