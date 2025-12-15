import { Order } from './order.entity';
import { Product } from '../../catalog/products/entities/product.entity';
export declare class OrderItem {
    id: number;
    order: Order;
    product: Product | null;
    quantity: number;
    price: number;
    total: number;
    snapshot: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}
