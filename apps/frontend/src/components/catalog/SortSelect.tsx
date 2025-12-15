import React, { useMemo, useState } from 'react';
import { Listbox } from '@headlessui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductSort } from '@/shared/api/catalog';

type SortValue = ProductSort | string;

const OPTIONS: { label: string; value: ProductSort }[] = [
  { label: 'Популярные', value: ProductSort.POPULAR },
  { label: 'Цена: по возрастанию', value: ProductSort.PRICE_ASC },
  { label: 'Цена: по убыванию', value: ProductSort.PRICE_DESC },
  { label: 'Новинки', value: ProductSort.NEW },
];

interface SortSelectProps {
  value?: SortValue;
  onChange?: (value: ProductSort) => void;
}

const SortSelect: React.FC<SortSelectProps> = ({ value, onChange }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Если пропсы не переданы, используем URL-based логику
  const isControlled = value !== undefined && onChange !== undefined;
  
  const getInitialValue = (): ProductSort => {
    if (isControlled && value) {
      // Преобразуем строку в ProductSort, если нужно
      if (typeof value === 'string') {
        const normalized = value.toLowerCase().replace('_', '_');
        if (normalized === 'popular' || normalized === ProductSort.POPULAR) return ProductSort.POPULAR;
        if (normalized === 'price_asc' || normalized === ProductSort.PRICE_ASC) return ProductSort.PRICE_ASC;
        if (normalized === 'price_desc' || normalized === ProductSort.PRICE_DESC) return ProductSort.PRICE_DESC;
        if (normalized === 'new' || normalized === ProductSort.NEW) return ProductSort.NEW;
      }
      return value as ProductSort;
    }
    const urlSort = searchParams.get('sort');
    if (urlSort) {
      // Преобразуем URL параметр в ProductSort
      const normalized = urlSort.toLowerCase();
      if (normalized === 'popular' || normalized === ProductSort.POPULAR) return ProductSort.POPULAR;
      if (normalized === 'price_asc' || normalized === ProductSort.PRICE_ASC) return ProductSort.PRICE_ASC;
      if (normalized === 'price_desc' || normalized === ProductSort.PRICE_DESC) return ProductSort.PRICE_DESC;
      if (normalized === 'new' || normalized === ProductSort.NEW) return ProductSort.NEW;
    }
    return ProductSort.POPULAR;
  };
  
  const [selected, setSelected] = useState<ProductSort>(getInitialValue());

  // Синхронизируем с пропсом value
  React.useEffect(() => {
    if (isControlled && value) {
      // Преобразуем строку в ProductSort, если нужно
      if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        if (normalized === 'popular' || normalized === ProductSort.POPULAR) {
          setSelected(ProductSort.POPULAR);
        } else if (normalized === 'price_asc' || normalized === ProductSort.PRICE_ASC) {
          setSelected(ProductSort.PRICE_ASC);
        } else if (normalized === 'price_desc' || normalized === ProductSort.PRICE_DESC) {
          setSelected(ProductSort.PRICE_DESC);
        } else if (normalized === 'new' || normalized === ProductSort.NEW) {
          setSelected(ProductSort.NEW);
        } else {
          setSelected(ProductSort.POPULAR);
        }
      } else {
        setSelected(value as ProductSort);
      }
    }
  }, [value, isControlled]);

  const selectedLabel = useMemo(
    () => OPTIONS.find((o) => o.value === selected)?.label ?? 'Популярные',
    [selected],
  );

  const applySort = (val: ProductSort) => {
    if (isControlled && onChange) {
      onChange(val);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        // Преобразуем ProductSort в строку для URL
        const sortStr = val.toLowerCase().replace('_', '_');
        params.set('sort', sortStr);
      } else {
        params.delete('sort');
      }
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <div className="sort-select" style={{ minWidth: 220 }}>
      <Listbox
        value={selected}
        onChange={(val: ProductSort) => {
          setSelected(val);
          applySort(val);
        }}
      >
        <div className="relative">
          <Listbox.Button
            className="sort-select__button"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 10px',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <span>{selectedLabel}</span>
            <span aria-hidden>▾</span>
          </Listbox.Button>
          <Listbox.Options
            className="sort-select__options"
            style={{
              position: 'absolute',
              zIndex: 10,
              marginTop: 6,
              width: '100%',
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            {OPTIONS.map((opt) => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  `sort-select__option ${active ? 'active' : ''}`
                }
              >
                {({ selected: isSel }) => (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: isSel ? '#f5f5f5' : '#fff',
                    }}
                  >
                    {isSel ? '✓' : ''}
                    <span>{opt.label}</span>
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
};

export default SortSelect;
