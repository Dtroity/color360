"use client";

import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/shared/utils/cn";

export type SelectOption<TValue extends string | number> = {
  label: string;
  value: TValue;
};

type SelectProps<TValue extends string | number> = {
  options: Array<SelectOption<TValue>>;
  value: SelectOption<TValue>;
  onChange: (value: SelectOption<TValue>) => void;
  label?: string;
};

export const Select = <TValue extends string | number>({
  options,
  value,
  onChange,
  label,
}: SelectProps<TValue>) => (
  <Listbox value={value} onChange={onChange}>
    {({ open }) => (
      <div className="space-y-1">
        {label && (
          <Listbox.Label className="text-sm font-medium text-neutral-700">
            {label}
          </Listbox.Label>
        )}
        <div className="relative">
          <Listbox.Button
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
              open && "border-primary-500",
            )}
          >
            <span>{value.label}</span>
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-2 w-full rounded-2xl border border-neutral-100 bg-white p-1 text-sm shadow-2xl focus:outline-none">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option}
                  className={({ active }) =>
                    cn(
                      "flex cursor-pointer items-center justify-between rounded-xl px-4 py-3",
                      active
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700",
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span>{option.label}</span>
                      {selected && (
                        <Check className="h-4 w-4 text-primary-600" />
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </div>
    )}
  </Listbox>
);

