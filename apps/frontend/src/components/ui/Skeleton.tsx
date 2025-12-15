import { cn } from "@/shared/utils/cn";

type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      "animate-pulse rounded-2xl bg-neutral-200/70",
      className,
    )}
  />
);

