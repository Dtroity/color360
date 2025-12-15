import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../catalog/products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    const now = new Date();

    // Start of today
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 30 days ago (for chart)
    const startOfRange = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 29,
    );

    // Total revenue for current month (paid/shipped/completed)
    const revenueRaw = await this.orderRepository
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.totalAmount), 0)', 'sum')
      .where('o.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('o.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.COMPLETED,
        ],
      })
      .getRawOne<{ sum: string }>();

    const totalRevenue = Number(revenueRaw?.sum ?? 0);

    // New orders today (pending as new)
    const newOrders = await this.orderRepository
      .count({
        where: {
          status: OrderStatus.PENDING,
          createdAt: ((): any => ({ $gte: startOfDay }))(), // will be replaced by query builder below if driver doesn't support
        } as any,
      })
      .catch(async () => {
        // Fallback: query builder for drivers that don't support object syntax
        return this.orderRepository
          .createQueryBuilder('o')
          .where('o.status = :status', { status: OrderStatus.PENDING })
          .andWhere('o.createdAt >= :startOfDay', { startOfDay })
          .getCount();
      });

    // Products in stock (stock > 0 and isActive)
    const productsInStock = await this.productRepository
      .createQueryBuilder('p')
      .where('p.stock > 0')
      .andWhere('p.isActive = :active', { active: true })
      .getCount();

    // New users in last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const newUsers = await this.userRepository
      .createQueryBuilder('u')
      .where('u.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    // Sales chart: last 30 days grouped by day (PostgreSQL DATE_TRUNC)
    const chartRows = await this.orderRepository
      .createQueryBuilder('o')
      .select("TO_CHAR(DATE_TRUNC('day', o.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect('COALESCE(SUM(o.totalAmount), 0)', 'amount')
      .where('o.createdAt >= :startOfRange', { startOfRange })
      .andWhere('o.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.COMPLETED,
        ],
      })
      .groupBy("DATE_TRUNC('day', o.createdAt)")
      .orderBy("DATE_TRUNC('day', o.createdAt)", 'ASC')
      .getRawMany<{ day: string; amount: string }>();

    // Normalize chart to continuous 30 days
    const salesChart: { date: string; amount: number }[] = [];
    const map = new Map(chartRows.map((r) => [r.day, Number(r.amount)]));
    for (let i = 0; i < 30; i++) {
      const d = new Date(
        startOfRange.getFullYear(),
        startOfRange.getMonth(),
        startOfRange.getDate() + i,
      );
      const key = d.toISOString().slice(0, 10);
      salesChart.push({ date: key, amount: map.get(key) ?? 0 });
    }

    // Recent orders (5)
    const recentOrders = await this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('o.createdAt', 'DESC')
      .take(5)
      .getMany();

    // Low stock products (stock < 5)
    const lowStockProducts = await this.productRepository
      .createQueryBuilder('p')
      .where('p.stock < :threshold', { threshold: 5 })
      .andWhere('p.isActive = :active', { active: true })
      .orderBy('p.stock', 'ASC')
      .take(10)
      .getMany();

    return {
      totalRevenue,
      newOrders,
      productsInStock,
      newUsers,
      salesChart,
      recentOrders,
      lowStockProducts,
    };
  }
}
