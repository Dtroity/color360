'use client';

import { useMemo, useState } from 'react';
import { Input } from '../../ui/Input';

export interface ManufacturerWithCount {
  id: number;
  name: string;
  count?: number;
}

interface ManufacturerFilterProps {
  value: number[];
  onChange: (ids: number[]) => void;
  manufacturers?: ManufacturerWithCount[]; // Опционально, если нужно показывать список
}

export function ManufacturerFilter({ value, onChange, manufacturers = [] }: ManufacturerFilterProps) {
  const [search, setSearch] = useState('');

  const showSearch = manufacturers.length > 10;

  const filteredManufacturers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!showSearch || !term) return manufacturers;
    return manufacturers.filter((m) => m.name.toLowerCase().includes(term));
  }, [manufacturers, search, showSearch]);

  const toggleId = (id: number) => {
    const isSelected = value.includes(id);
    const next = isSelected ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  };

  // Если список производителей не передан, показываем простой чекбокс
  if (manufacturers.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-500">Загрузка производителей...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showSearch && (
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск производителя"
        />
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {filteredManufacturers.map((m) => (
          <label
            key={m.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-neutral-50"
          >
            <input
              type="checkbox"
              checked={value.includes(m.id)}
              onChange={() => toggleId(m.id)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">
              {m.name}
              {m.count !== undefined && (
                <span className="ml-1 text-neutral-500">({m.count})</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
