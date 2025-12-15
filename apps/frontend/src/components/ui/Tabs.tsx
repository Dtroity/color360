"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

type Tab = {
  label: string;
  value: string;
};

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export const Tabs = ({ tabs, value, onChange, className }: TabsProps) => (
  <div className={cn("flex rounded-full bg-neutral-100 p-1", className)}>
    {tabs.map((tab) => {
      const isActive = tab.value === value;
      return (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition",
            isActive
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-900",
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

