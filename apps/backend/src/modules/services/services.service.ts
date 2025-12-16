import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InstallationService, PriceType } from './entities/installation-service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(InstallationService)
    private readonly serviceRepo: Repository<InstallationService>,
  ) {}

  async findAll() {
    return this.serviceRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', title: 'ASC' },
    });
  }

  async calculate(dto: { services: Array<{ serviceId: number; quantity?: number }> }) {
    const serviceIds = dto.services.map(s => s.serviceId);
    const services = await this.serviceRepo.find({
      where: { id: In(serviceIds) },
    });

    let total = 0;
    const items: Array<{ service: InstallationService; quantity: number; price: number }> = [];

    for (const selected of dto.services) {
      const service = services.find(s => s.id === selected.serviceId);
      if (!service || !service.isActive) continue;

      const quantity = Math.max(selected.quantity || 1, service.minQuantity || 1);
      let price = 0;

      if (service.priceType === PriceType.FIXED) {
        // Фиксированная цена
        price = Number(service.basePrice);
      } else if (service.priceType === PriceType.PER_UNIT) {
        // Цена за единицу
        price = Number(service.basePrice) * quantity;
      }

      total += price;
      items.push({ service, quantity, price });
    }

    return {
      items,
      total,
      currency: 'RUB',
    };
  }
}

