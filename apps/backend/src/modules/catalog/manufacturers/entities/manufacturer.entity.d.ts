import { Product } from '../../products/entities/product.entity';
export declare class Manufacturer {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    country: string | null;
    website: string | null;
    isActive: boolean;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
