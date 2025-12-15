import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class ImageDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  manufacturerId?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(['in_stock', 'out_of_stock', 'on_order'])
  availability?: 'in_stock' | 'out_of_stock' | 'on_order';

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];
}

