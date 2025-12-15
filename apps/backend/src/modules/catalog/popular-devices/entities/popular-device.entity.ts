import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('popular_devices')
export class PopularDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'int', nullable: true })
  productId: number | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  product: Product | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

