import { Category } from '../../categories/entities/category.entity';
import { Manufacturer } from '../../manufacturers/entities/manufacturer.entity';
import { ProductImage } from './product-image.entity';
import { OrderItem } from '../../../orders/entities/order-item.entity';
export declare class Product {
    id: number;
    name: string;
    slug: string;
    sku: string;
    shortDescription: string | null;
    description: string | null;
    price: number;
    oldPrice: number | null;
    currency: string;
    stock: number;
    isActive: boolean;
    availability: string | null;
    externalId: string | null;
    attributes: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    seo: Record<string, unknown> | null;
    manufacturer: Manufacturer | null;
    category: Category | null;
    images: ProductImage[];
    orderItems: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
