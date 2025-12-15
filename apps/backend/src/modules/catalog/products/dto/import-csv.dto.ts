export class ImportCsvDto {
  mode?: 'create' | 'update' | 'upsert' = 'upsert';
  skipDuplicates?: boolean = false;
}

export interface CsvRow {
  name: string;
  sku: string;
  price: number;
  stock: number;
  category?: string;
  brand?: string;
  description?: string;
  image_url?: string;
  shortDescription?: string;
  oldPrice?: number;
  currency?: string;
  isActive?: boolean;
}

export interface ImportResult {
  success: number;
  errors: number;
  skipped: number;
  details: ImportDetail[];
}

export interface ImportDetail {
  row: number;
  sku: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

