"use client";

import * as React from "react";
import { cn } from "@/shared/utils/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          "w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
          error && "border-accent-500 focus:ring-accent-200",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-accent-500">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";

