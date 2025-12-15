'use client';

import { useState, useEffect } from 'react';
import { Input } from '../../ui/Input';

interface PriceRangeFilterProps {
  priceFrom?: number;
  priceTo?: number;
  onChange: (priceFrom?: number, priceTo?: number) => void;
}

export function PriceRangeFilter({ priceFrom, priceTo, onChange }: PriceRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(priceFrom?.toString() || '');
  const [localTo, setLocalTo] = useState(priceTo?.toString() || '');

  useEffect(() => {
    setLocalFrom(priceFrom?.toString() || '');
  }, [priceFrom]);

  useEffect(() => {
    setLocalTo(priceTo?.toString() || '');
  }, [priceTo]);

  const handleFromChange = (value: string) => {
    setLocalFrom(value);
    const num = value ? Number(value) : undefined;
    onChange(num, priceTo);
  };

  const handleToChange = (value: string) => {
    setLocalTo(value);
    const num = value ? Number(value) : undefined;
    onChange(priceFrom, num);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="От"
          value={localFrom}
          onChange={(e) => handleFromChange(e.target.value)}
          className="flex-1"
        />
        <span className="text-neutral-500">—</span>
        <Input
          type="number"
          placeholder="До"
          value={localTo}
          onChange={(e) => handleToChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
}
