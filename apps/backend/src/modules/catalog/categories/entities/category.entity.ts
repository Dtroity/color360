import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 150, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string | null = null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  /**
   * Родительская категория
   * null для корневых категорий
   */
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parent: Category | null = null;

  /**
   * Дочерние категории
   * Инициализируется как пустой массив, TypeORM заполнит при загрузке
   */
  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  /**
   * Товары в этой категории
   * Инициализируется как пустой массив, TypeORM заполнит при загрузке
   */
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
