import { Product } from './product.entity';
export declare class ProductImage {
    id: number;
    url: string;
    alt: string | null;
    sortOrder: number;
    product: Product;
    createdAt: Date;
    updatedAt: Date;
}
