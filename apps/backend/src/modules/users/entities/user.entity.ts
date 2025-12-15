import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CUSTOMER = 'customer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, unique: true })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  firstName: string | null = null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  lastName: string | null = null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null = null;

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}