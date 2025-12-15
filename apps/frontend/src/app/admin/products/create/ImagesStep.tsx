'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';

type ImageItem = {
  file?: File;
  url?: string;
  isMain?: boolean;
};

interface ImagesStepProps {
  form: UseFormReturn<any>;
}

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImagesStep({ form }: ImagesStepProps) {
  const { setValue, watch } = form;
  const [items, setItems] = useState<ImageItem[]>(() => watch('images') || []);
  const dragIndex = useRef<number | null>(null);

  // sync to form whenever items change
  useEffect(() => {
    setValue('images', items, { shouldDirty: true, shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filtered = acceptedFiles
      .filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_SIZE_BYTES)
      .slice(0, Math.max(0, MAX_FILES - (items?.length || 0)));

    const mapped = filtered.map((file) => ({ file, isMain: false }));
    setItems((prev) => {
      const next = [...(prev || []), ...mapped];
      if (!next.some((i) => i.isMain) && next.length > 0) {
        next[0].isMain = true;
      }
      return next;
    });
  }, [items]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_SIZE_BYTES,
    multiple: true,
  });

  const setMain = (idx: number) => {
    setItems((prev) => (prev || []).map((it, i) => ({ ...it, isMain: i === idx })));
  };

  const remove = (idx: number) => {
    setItems((prev) => {
      const next = (prev || []).filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((i) => i.isMain)) {
        next[0].isMain = true;
      }
      return next;
    });
  };

  // simple drag-sort (pointer events)
  const onDragStart = (idx: number) => {
    dragIndex.current = idx;
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const onDropReorder = (overIdx: number) => {
    const from = dragIndex.current;
    if (from == null || from === overIdx) return;
    setItems((prev) => {
      const arr = [...(prev || [])];
      const [moved] = arr.splice(from, 1);
      arr.splice(overIdx, 0, moved);
      return arr;
    });
    dragIndex.current = null;
  };

  const previews = useMemo(() => {
    return (items || []).map((it) => {
      if (it.file) {
        return URL.createObjectURL(it.file);
      }
      return it.url || '';
    });
  }, [items]);

  // revoke object URLs on unmount/change
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.startsWith('blob:')) URL.revokeObjectURL(p);
      });
    };
  }, [previews]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-700">
          Перетащите файлы сюда или нажмите для выбора. Допустимые форматы: JPG, PNG, WebP. Максимум 10 файлов, до 5MB каждый.
        </p>
      </div>

      {items && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="relative group border rounded-md overflow-hidden bg-white"
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e)}
              onDrop={() => onDropReorder(idx)}
            >
              {previews[idx] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[idx]} alt={`preview-${idx}`} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-gray-400">Нет превью</div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="radio"
                    name="mainImage"
                    checked={!!it.isMain}
                    onChange={() => setMain(idx)}
                  />
                  Главное изображение
                </label>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => remove(idx)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items && items.length >= MAX_FILES && (
        <div className="text-xs text-gray-500">Достигнут лимит в {MAX_FILES} файлов</div>
      )}
    </div>
  );
}
