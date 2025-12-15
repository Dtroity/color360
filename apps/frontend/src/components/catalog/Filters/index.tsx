'use client';

import { ManufacturerFilter } from './ManufacturerFilter';
import { PriceRangeFilter } from './PriceRangeFilter';
import type { ProductFilterParams } from '@/shared/api/catalog';

interface FiltersProps {
  filters: ProductFilterParams;
  onFiltersChange: (filters: Partial<ProductFilterParams>) => void;
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Производители</h3>
        <ManufacturerFilter
          value={filters.manufacturers || []}
          onChange={(manufacturers) =>
            onFiltersChange({
              manufacturers: manufacturers.length > 0 ? manufacturers : undefined,
              page: undefined,
            })
          }
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Цена</h3>
        <PriceRangeFilter
          priceFrom={filters.priceFrom}
          priceTo={filters.priceTo}
          onChange={(priceFrom, priceTo) =>
            onFiltersChange({ priceFrom, priceTo, page: undefined })
          }
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.inStock || false}
            onChange={(e) => onFiltersChange({ inStock: e.target.checked || undefined, page: undefined })}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-neutral-700">Только в наличии</span>
        </label>
      </div>
    </div>
  );
}

export default Filters;
