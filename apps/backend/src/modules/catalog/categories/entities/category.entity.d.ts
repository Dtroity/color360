import { Product } from '../../products/entities/product.entity';
export declare class Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
    isActive: boolean;
    parent: Category | null;
    children: Category[];
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
