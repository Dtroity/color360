import { User } from '../modules/users/entities/user.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
export declare enum OrderStatus {
    DRAFT = "draft",
    PENDING = "pending",
    PAID = "paid",
    SHIPPED = "shipped",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: number;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    shippingAddress: Record<string, unknown> | null;
    billingAddress: Record<string, unknown> | null;
    comment: string | null;
    metadata: Record<string, unknown> | null;
    user: User | null;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
