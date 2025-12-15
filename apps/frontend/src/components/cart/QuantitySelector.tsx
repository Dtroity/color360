import React, { useCallback, useState } from 'react';

interface QuantitySelectorProps {
  value: number;
  max: number; // остаток на складе
  onChange: (newValue: number) => void;
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({ value, max, onChange, disabled }) => {
  const [internal, setInternal] = useState<string>(String(value));

  const clamp = useCallback(
    (v: number) => {
      if (Number.isNaN(v) || v < 1) return 1;
      if (max && v > max) return max;
      return v;
    },
    [max],
  );

  const apply = useCallback(
    (raw: string) => {
      const num = clamp(Number(raw));
      setInternal(String(num));
      if (num !== value) onChange(num);
    },
    [clamp, value, onChange],
  );

  const dec = () => {
    if (disabled) return;
    apply(String(value - 1));
  };

  const inc = () => {
    if (disabled) return;
    apply(String(value + 1));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInternal(raw);
  };

  const onBlur = () => apply(internal);

  const minusDisabled = disabled || value <= 1;
  const plusDisabled = disabled || (max ? value >= max : false);

  return (
    <div
      className="quantity-selector"
      style={{ display: 'inline-flex', alignItems: 'stretch', height: 40, border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', background: disabled ? '#fafafa' : '#fff' }}
    >
      <button
        type="button"
        onClick={dec}
        disabled={minusDisabled}
        aria-label="Уменьшить"
        style={{
          width: 40,
          border: 'none',
          background: minusDisabled ? '#f5f5f5' : '#fff',
          cursor: minusDisabled ? 'not-allowed' : 'pointer',
          fontSize: 20,
        }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={internal}
        onChange={onInputChange}
        onBlur={onBlur}
        aria-label="Количество"
        disabled={disabled}
        style={{
          width: 58,
          textAlign: 'center',
          border: 'none',
          outline: 'none',
          fontSize: 16,
          background: 'transparent',
        }}
      />
      <button
        type="button"
        onClick={inc}
        disabled={plusDisabled}
        aria-label="Увеличить"
        style={{
          width: 40,
          border: 'none',
          background: plusDisabled ? '#f5f5f5' : '#fff',
          cursor: plusDisabled ? 'not-allowed' : 'pointer',
          fontSize: 20,
        }}
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
