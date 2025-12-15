import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('manufacturers')
export class Manufacturer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string | null = null;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string | null = null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null = null;

  @Column({ default: true })
  isActive: boolean;

  /**
   * Товары этого производителя
   * Инициализируется как пустой массив, TypeORM заполнит при загрузке
   */
  @OneToMany(() => Product, (product) => product.manufacturer)
  products!: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
