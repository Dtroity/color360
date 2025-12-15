import { Controller, Get, Query, Param, NotFoundException, Patch, Body, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductFilterDto } from './dto/product-filter.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список товаров', description: 'Возвращает список товаров с фильтрацией, сортировкой и пагинацией' })
  @ApiResponse({ status: 200, description: 'Список товаров успешно получен' })
  @ApiQuery({ name: 'manufacturers', required: false, type: [Number], description: 'ID производителей' })
  @ApiQuery({ name: 'categories', required: false, type: [Number], description: 'ID категорий' })
  @ApiQuery({ name: 'priceFrom', required: false, type: Number, description: 'Минимальная цена' })
  @ApiQuery({ name: 'priceTo', required: false, type: Number, description: 'Максимальная цена' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Только в наличии' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Поиск по названию или SKU' })
  @ApiQuery({ name: 'sort', required: false, enum: ['price_asc', 'price_desc', 'popular', 'new'], description: 'Сортировка' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество товаров на странице' })
  async findAll(@Query() filterDto: ProductFilterDto) {
    console.log('GET /api/products with filters:', filterDto);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.controller.ts:24',message:'GET /api/products request',data:{filters:filterDto},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const result = await this.productsService.findAll(filterDto);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.controller.ts:28',message:'GET /api/products response',data:{total:result.total,count:result.data?.length,limit:result.limit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return result;
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Получить товар по ID', description: 'Возвращает информацию о товаре по его ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID товара' })
  @ApiResponse({ status: 200, description: 'Товар найден' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async findById(@Param('id') id: string) {
    console.log('GET /api/products/id/:id', id);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.controller.ts:41',message:'GET /api/products/id/:id request',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const parsed = Number(id);
    if (Number.isNaN(parsed)) {
      throw new NotFoundException(`Invalid product ID: ${id}`);
    }
    try {
      const result = await this.productsService.findById(parsed);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.controller.ts:49',message:'GET /api/products/id/:id response',data:{id:result.id,name:result.name,hasImages:!!result.images,imagesCount:result.images?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products.controller.ts:54',message:'GET /api/products/id/:id error',data:{id,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Product with id ${id} not found`);
    }
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Получить товар по slug', description: 'Возвращает информацию о товаре по его slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Slug товара' })
  @ApiResponse({ status: 200, description: 'Товар найден' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async findOne(@Param('slug') slug: string) {
    console.log('GET /api/products/:slug', slug);
    try {
      return await this.productsService.findBySlug(slug);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать товар', description: 'Создает новый товар' })
  async create(@Body() dto: any) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить товар', description: 'Частично обновляет информацию о товаре' })
  @ApiParam({ name: 'id', type: Number })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить товар', description: 'Удаляет товар по ID' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }
}

