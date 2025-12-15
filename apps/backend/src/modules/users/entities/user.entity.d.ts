import { Order } from '../../orders/entities/order.entity';
export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    CUSTOMER = "customer"
}
export declare class User {
    id: number;
    email: string;
    passwordHash: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    isActive: boolean;
    lastLoginAt: Date | null;
    orders: Order[];
    createdAt: Date;
    updatedAt: Date;
}
