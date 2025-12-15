import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../catalog/products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Заказ, к которому относится элемент
   * Инициализируется TypeORM при создании
   */
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order!: Order;

  /**
   * Товар, связанный с этим элементом заказа
   * null если товар был удален
   */
  @ManyToOne(() => Product, (product) => product.orderItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  product: Product | null = null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'jsonb', nullable: true })
  snapshot: Record<string, unknown> | null = null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
