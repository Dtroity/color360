"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/shared/utils/cn";

const variants = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-500 focus:ring-primary-100",
  secondary:
    "bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-200",
  outline:
    "border border-neutral-300 text-neutral-900 hover:border-primary-500 hover:text-primary-600",
  ghost: "text-neutral-600 hover:bg-neutral-100",
};

const sizes = {
  base: "px-5 py-3 text-sm font-semibold",
  lg: "px-6 py-3 text-base font-semibold",
  icon: "h-11 w-11 p-0 flex items-center justify-center",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "base",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "rounded-full transition focus:outline-none focus:ring-4 disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

