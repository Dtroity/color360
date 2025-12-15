import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 40, unique: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ length: 8, default: 'RUB' })
  currency: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  customerName: string | null = null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  customerEmail: string | null = null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  customerPhone: string | null = null;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: Record<string, unknown> | null = null;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress: Record<string, unknown> | null = null;

  @Column({ type: 'text', nullable: true })
  comment: string | null = null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null = null;

  @ManyToOne(() => User, (user) => user.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user: User | null = null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items!: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}