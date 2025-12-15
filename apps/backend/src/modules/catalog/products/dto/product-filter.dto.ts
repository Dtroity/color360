import { IsOptional, IsArray, IsNumber, IsBoolean, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSort } from '../products.service';

export class ProductFilterDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  manufacturers?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  categories?: number[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceFrom?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceTo?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductSort)
  sort?: ProductSort;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

