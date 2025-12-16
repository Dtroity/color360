import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Тип цены услуги
 */
export enum PriceType {
  FIXED = 'fixed',      // Фиксированная цена
  PER_UNIT = 'per_unit', // Цена за единицу
}

/**
 * Сущность услуги монтажа и настройки видеонаблюдения
 */
@Entity('installation_services')
export class InstallationService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  basePrice: number;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.FIXED,
  })
  priceType: PriceType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unitName: string | null = null; // Единица измерения (камера, метр и т.п.)

  @Column({ type: 'int', nullable: true, default: 1 })
  minQuantity: number | null = 1;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

