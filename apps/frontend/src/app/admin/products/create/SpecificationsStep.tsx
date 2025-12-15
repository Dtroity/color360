'use client';

import { useEffect, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

type SpecPair = { name: string; value: string };

interface SpecificationsStepProps {
  form: UseFormReturn<any>;
}

// Предустановленные шаблоны по категориям
const CATEGORY_TEMPLATES: Record<string | number, SpecPair[]> = {
  // Камеры
  cameras: [
    { name: 'Разрешение', value: '' },
    { name: 'Объектив', value: '' },
    { name: 'ИК подсветка', value: '' },
    { name: 'Тип матрицы', value: '' },
    { name: 'Угол обзора', value: '' },
  ],
  // Видеорегистраторы
  dvrs: [
    { name: 'Каналы', value: '' },
    { name: 'Поддержка HDD', value: '' },
    { name: 'Сетевые функции', value: '' },
    { name: 'Компрессия', value: '' },
  ],
  // Радар/датчики
  sensors: [
    { name: 'Тип датчика', value: '' },
    { name: 'Дальность', value: '' },
    { name: 'Угол обнаружения', value: '' },
  ],
};

function specsToJson(specs: SpecPair[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of specs) {
    const k = (s.name || '').trim();
    const v = (s.value || '').trim();
    if (k) out[k] = v;
  }
  return out;
}

function jsonToSpecs(obj: unknown): SpecPair[] {
  if (!obj || typeof obj !== 'object') return [];
  const entries = Object.entries(obj as Record<string, unknown>);
  return entries.map(([k, v]) => ({ name: k, value: String(v ?? '') }));
}

export default function SpecificationsStep({ form }: SpecificationsStepProps) {
  const { setValue, watch } = form;

  // Храним список пар локально для удобного редактирования
  const [specs, setSpecs] = useState<SpecPair[]>(() => {
    const initial = watch('attributes');
    return jsonToSpecs(initial ?? {});
  });

  // Следим за изменениями и сериализуем в JSON для сохранения
  useEffect(() => {
    const json = specsToJson(specs);
    setValue('attributes', json, { shouldValidate: true, shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs]);

  const addSpec = () => {
    setSpecs((prev) => [...prev, { name: '', value: '' }]);
  };

  const removeSpec = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSpec = (idx: number, field: keyof SpecPair, val: string) => {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)));
  };

  // Определяем подходящий шаблон по выбранной категории
  const categoryId = watch('categoryId');
  const suggestedTemplate = useMemo(() => {
    // Попытка сопоставить по строковым кодам либо конкретным ID
    if (!categoryId) return null;
    const idStr = String(categoryId).toLowerCase();
    if (CATEGORY_TEMPLATES[idStr]) return CATEGORY_TEMPLATES[idStr];
    // эвристика: если название категории содержит camera/cam
    // (ожидается, что вверх по дереву есть slug, но тут только ID, поэтому оставим ручной выбор)
    return null;
  }, [categoryId]);

  const applyTemplate = (tpl: SpecPair[]) => {
    setSpecs(tpl.map((t) => ({ ...t }))); // копия
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Характеристики</h3>
          <p className="text-sm text-gray-600">Добавьте технические параметры товара</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addSpec}
            className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            + Добавить характеристику
          </button>
        </div>
      </div>

      {/* Подсказка/шаблоны */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Сохраняется в JSON формате: ключ-значение</p>
          <div className="flex items-center gap-2">
            <select
              className="px-2 py-1 border rounded-md text-sm border-gray-300"
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if (val && CATEGORY_TEMPLATES[val]) applyTemplate(CATEGORY_TEMPLATES[val]);
              }}
            >
              <option value="">Выбрать шаблон…</option>
              <option value="cameras">Камеры</option>
              <option value="dvrs">Видеорегистраторы</option>
              <option value="sensors">Датчики</option>
            </select>
            {suggestedTemplate && (
              <button
                type="button"
                className="px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm"
                onClick={() => applyTemplate(suggestedTemplate)}
                title="Применить шаблон по категории"
              >
                Применить шаблон категории
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Список характеристик */}
      <div className="space-y-3">
        {specs.map((s, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-start">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
              <input
                type="text"
                value={s.name}
                onChange={(e) => updateSpec(idx, 'name', e.target.value)}
                placeholder="Например: Разрешение"
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Значение</label>
              <input
                type="text"
                value={s.value}
                onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                placeholder="Например: 4 Мп"
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-6">
              <button
                type="button"
                onClick={() => removeSpec(idx)}
                className="px-3 py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 text-sm"
                title="Удалить"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {specs.length === 0 && (
          <div className="text-sm text-gray-500">Характеристики не добавлены</div>
        )}
      </div>
    </div>
  );
}
