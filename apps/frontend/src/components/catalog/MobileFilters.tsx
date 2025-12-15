'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { Filters } from './Filters';
import { Button } from '../ui/Button';
import type { ProductFilterParams } from '../../shared/api/catalog';

interface MobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilterParams;
  onFiltersChange: (filters: Partial<ProductFilterParams>) => void;
}

export function MobileFilters({ isOpen, onClose, filters, onFiltersChange }: MobileFiltersProps) {
  const activeFiltersCount =
    (filters.manufacturers?.length || 0) +
    (filters.categories?.length || 0) +
    (filters.priceFrom ? 1 : 0) +
    (filters.priceTo ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const handleReset = () => {
    onFiltersChange({
      manufacturers: undefined,
      categories: undefined,
      priceFrom: undefined,
      priceTo: undefined,
      inStock: undefined,
      page: undefined,
    });
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50 lg:hidden">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-stretch justify-end">
              <Dialog.Panel className="w-full max-w-sm bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-neutral-900">
                    Фильтры
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 text-sm font-normal text-primary-600">
                        ({activeFiltersCount})
                      </span>
                    )}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                    aria-label="Закрыть"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 py-4">
                  <Filters filters={filters} onFiltersChange={onFiltersChange} />
                </div>

                <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        onClose();
                      }}
                      className="flex-1"
                    >
                      Показать товары{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                    </Button>
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={handleReset}>
                        Сбросить
                      </Button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

export default MobileFilters;
