import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список услуг', description: 'Возвращает все активные услуги' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Рассчитать стоимость услуг', description: 'Рассчитывает итоговую стоимость на основе выбранных услуг' })
  async calculate(@Body() dto: { services: Array<{ serviceId: number; quantity?: number }> }) {
    return this.servicesService.calculate(dto);
  }
}

