import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export enum ProductSort {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULAR = 'popular',
  NEW = 'new',
}

export interface ProductFilterParams {
  manufacturers?: number[];
  categories?: number[];
  priceFrom?: number;
  priceTo?: number;
  inStock?: boolean;
  search?: string;
  sort?: ProductSort;
  page?: number; // default server-side: 1
  limit?: number; // default server-side: 20
}

export interface Manufacturer {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  sortOrder?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  currency: string;
  stock: number;
  isActive: boolean;
  availability?: string | null;
  externalId?: string | null;
  attributes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  manufacturer?: Manufacturer | null;
  category?: Category | null;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export const catalogApi = {
  async getProducts(params: ProductFilterParams): Promise<GetProductsResponse> {
    console.log('[API] getProducts called with params:', params);
    const url = `${API_BASE_URL}/api/products`;
    console.log('[API] Request URL:', url, 'Query params:', params);
    const response = await axios.get<GetProductsResponse>(url, {
      params,
    });
    console.log('[API] getProducts response:', { 
      count: response.data.data?.length, 
      total: response.data.total, 
      limit: response.data.limit,
      page: response.data.page 
    });
    return response.data;
  },
  async getProductBySlug(slug: string): Promise<Product | null> {
    console.log('[API] getProductBySlug called with slug:', slug);
    try {
      const url = `${API_BASE_URL}/api/products/${slug}`;
      console.log('[API] Request URL:', url);
      const response = await axios.get<Product>(url);
      console.log('[API] getProductBySlug success:', { id: response.data.id, name: response.data.name });
      return response.data;
    } catch (error) {
      console.error('[API] getProductBySlug error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn('[API] Product not found by slug:', slug);
        return null;
      }
      throw error;
    }
  },
  async getProductById(id: number): Promise<Product | null> {
    console.log('[API] getProductById called with id:', id);
    try {
      const url = `${API_BASE_URL}/api/products/id/${id}`;
      console.log('[API] Request URL:', url);
      const response = await axios.get<Product>(url);
      console.log('[API] getProductById success:', { id: response.data.id, name: response.data.name });
      return response.data;
    } catch (error) {
      console.error('[API] getProductById error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn('[API] Product not found by id:', id);
        return null;
      }
      throw error;
    }
  },
};
