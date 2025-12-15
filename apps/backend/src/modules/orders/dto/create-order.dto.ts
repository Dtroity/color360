import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    description: 'ID товара',
    example: 1,
  })
  @IsNumber({}, { message: 'ID товара должен быть числом' })
  productId: number;

  @ApiProperty({
    description: 'Количество товара',
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Количество должно быть числом' })
  @Min(1, { message: 'Минимальное количество - 1' })
  quantity: number;
}

export class CreateOrderDto {
  // Контактная информация
  @ApiProperty({
    description: 'Имя',
    example: 'Иван',
    minLength: 2,
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Минимум 2 символа' })
  firstName: string;

  @ApiProperty({
    description: 'Фамилия',
    example: 'Петров',
    minLength: 2,
  })
  @IsString({ message: 'Фамилия должна быть строкой' })
  @MinLength(2, { message: 'Минимум 2 символа' })
  lastName: string;

  @ApiProperty({
    description: 'Email',
    example: 'ivan@example.com',
  })
  @IsEmail({}, { message: 'Неверный формат email' })
  email: string;

  @ApiProperty({
    description: 'Телефон в формате +79991234567',
    example: '+79991234567',
  })
  @IsString({ message: 'Телефон должен быть строкой' })
  @Matches(/^\+7\d{10}$/, {
    message: 'Телефон должен быть в формате +79991234567',
  })
  phone: string;

  // Доставка
  @ApiProperty({
    description: 'Способ доставки',
    enum: ['courier', 'pickup', 'transport'],
    example: 'courier',
  })
  @IsEnum(['courier', 'pickup', 'transport'], {
    message: 'Способ доставки должен быть courier, pickup или transport',
  })
  deliveryMethod: string;

  @ApiProperty({
    description: 'Город',
    example: 'Москва',
  })
  @IsString({ message: 'Город должен быть строкой' })
  @MinLength(2, { message: 'Минимум 2 символа' })
  city: string;

  @ApiPropertyOptional({
    description: 'Адрес доставки (для курьерской доставки)',
    example: 'ул. Ленина, д. 10, кв. 5',
  })
  @IsOptional()
  @IsString({ message: 'Адрес должен быть строкой' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Дата доставки',
    example: '2025-12-01',
  })
  @IsOptional()
  @IsString({ message: 'Дата доставки должна быть строкой' })
  deliveryDate?: string;

  // Оплата
  @ApiProperty({
    description: 'Способ оплаты',
    enum: ['cash', 'card', 'transfer'],
    example: 'cash',
  })
  @IsEnum(['cash', 'card', 'transfer'], {
    message: 'Способ оплаты должен быть cash, card или transfer',
  })
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'ИНН организации (для банковского перевода)',
    example: '1234567890',
  })
  @IsOptional()
  @IsString({ message: 'ИНН должен быть строкой' })
  companyInn?: string;

  @ApiPropertyOptional({
    description: 'Название организации (для банковского перевода)',
    example: 'ООО "Компания"',
  })
  @IsOptional()
  @IsString({ message: 'Название организации должно быть строкой' })
  companyName?: string;

  // Товары
  @ApiProperty({
    description: 'Список товаров в заказе',
    type: [OrderItemDto],
    example: [
      { productId: 1, quantity: 2 },
      { productId: 3, quantity: 1 },
    ],
  })
  @IsArray({ message: 'Товары должны быть массивом' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Дополнительная информация
  @ApiPropertyOptional({
    description: 'Комментарий к заказу',
    example: 'Позвоните за час до доставки',
  })
  @IsOptional()
  @IsString({ message: 'Комментарий должен быть строкой' })
  comment?: string;
}
