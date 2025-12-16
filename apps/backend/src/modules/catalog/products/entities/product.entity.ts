import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Manufacturer } from '../../manufacturers/entities/manufacturer.entity';
import { ProductImage } from './product-image.entity';
import { OrderItem } from '../../../orders/entities/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 160, unique: true })
  slug: string;

  @Column({ length: 80, unique: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string | null = null;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  oldPrice: number | null = null;

  @Column({ length: 8, default: 'RUB' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  availability: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId: string | null = null;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, unknown> | null = null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null = null;

  @Column({ type: 'jsonb', nullable: true })
  seo: Record<string, unknown> | null = null;

  /**
   * Производитель товара
   * null если производитель не указан
   */
  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  manufacturer: Manufacturer | null = null;

  /**
   * Категория товара
   * null если категория не указана
   */
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category | null = null;

  /**
   * Изображения товара
   * Инициализируется как пустой массив, TypeORM заполнит при загрузке
   */
  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images!: ProductImage[];

  /**
   * Элементы заказов, в которых присутствует этот товар
   * Инициализируется как пустой массив, TypeORM заполнит при загрузке
   */
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
