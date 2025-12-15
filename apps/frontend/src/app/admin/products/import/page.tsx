'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/shared/config/api';

type ImportMode = 'create' | 'update' | 'upsert';

type ImportDetail = {
  row: number;
  sku: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
};

type ImportResult = {
  success: number;
  errors: number;
  skipped: number;
  details: ImportDetail[];
};

export default function ProductsImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<ImportMode>('upsert');
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    if (!f.name.endsWith('.csv') && !f.type.includes('csv')) {
      alert('Файл должен быть в формате CSV');
      return;
    }
    setFile(f);
    setResult(null);
    parseFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const parseFile = async (f: File) => {
    try {
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      
      if (lines.length < 2) {
        alert('CSV файл должен содержать заголовки и хотя бы одну строку данных');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows: any[] = [];

      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            if (inQuotes && line[j + 1] === '"') {
              current += '"';
              j++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const row: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.replace(/^"|"$/g, '') || '';
          row[header] = value;
        });
        rows.push(row);
      }

      setPreviewRows(rows);
    } catch (error) {
      alert('Ошибка парсинга файла: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/import/template`);
      if (!response.ok) throw new Error('Не удалось скачать шаблон');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Ошибка скачивания шаблона: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const startImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      formData.append('skipDuplicates', String(skipDuplicates));

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data: ImportResult = JSON.parse(xhr.responseText);
          setResult(data);
          if (typeof window !== 'undefined' && (window as any).toast) {
            (window as any).toast.success(`Импорт завершён: ${data.success} успешно, ${data.errors} ошибок, ${data.skipped} пропущено`);
          }
        } else {
          const error = JSON.parse(xhr.responseText);
          alert('Ошибка импорта: ' + (error.message || 'Неизвестная ошибка'));
        }
        setImporting(false);
        setProgress(0);
      });

      xhr.addEventListener('error', () => {
        alert('Ошибка сети при импорте');
        setImporting(false);
        setProgress(0);
      });

      xhr.open('POST', `${API_BASE_URL}/api/admin/products/import/csv`);
      xhr.send(formData);
    } catch (error) {
      alert('Ошибка импорта: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Импорт товаров из CSV</h1>
          <p className="mt-1 text-sm text-gray-600">
            Загрузите CSV файл с товарами для массового импорта
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Назад к товарам
        </Link>
      </div>

      {/* Download template */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Нужен шаблон?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Скачайте шаблон CSV файла с примером данных
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Скачать шаблон
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-600">
          {isDragActive ? (
            <span className="font-medium text-blue-600">Отпустите файл здесь</span>
          ) : (
            <>
              <span className="font-medium text-blue-600">Нажмите для выбора</span> или перетащите CSV файл сюда
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-gray-500">Поддерживаются только CSV файлы</p>
        {file && (
          <p className="mt-2 text-sm font-medium text-gray-900">
            Выбран: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Import options */}
      {file && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Настройки импорта</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Режим импорта
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ImportMode)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={importing}
              >
                <option value="create">Только создание новых</option>
                <option value="update">Только обновление существующих</option>
                <option value="upsert">Создание и обновление</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skipDuplicates"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={importing}
              />
              <label htmlFor="skipDuplicates" className="ml-2 text-sm text-gray-700">
                Пропускать дубликаты (если товар с таким SKU уже существует)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewRows.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Предпросмотр (первые {previewRows.length} строк)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(previewRows[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value: any, j) => (
                      <td key={j} className="px-4 py-2 text-gray-700">
                        {String(value || '').substring(0, 50)}
                        {String(value || '').length > 50 ? '...' : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress */}
      {importing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Импорт в процессе...</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Import button */}
      {file && !importing && (
        <div className="flex items-center gap-3">
          <button
            onClick={startImport}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Начать импорт
          </button>
          <button
            onClick={() => {
              setFile(null);
              setPreviewRows([]);
              setResult(null);
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            Очистить
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Результаты импорта</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium">Успешно</p>
              <p className="text-2xl font-bold text-green-900">{result.success}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium">Ошибки</p>
              <p className="text-2xl font-bold text-red-900">{result.errors}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 font-medium">Пропущено</p>
              <p className="text-2xl font-bold text-yellow-900">{result.skipped}</p>
            </div>
          </div>

          {result.details.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Строка</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Сообщение</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.details.map((detail, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-700">{detail.row}</td>
                      <td className="px-4 py-2 text-gray-700 font-mono">{detail.sku}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            detail.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : detail.status === 'error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {detail.status === 'success' ? 'Успешно' : detail.status === 'error' ? 'Ошибка' : 'Пропущено'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700">{detail.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
