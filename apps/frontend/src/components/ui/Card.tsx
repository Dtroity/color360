import { cn } from "@/shared/utils/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => (
  <div
    className={cn(
      "rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-elevated",
      className,
    )}
  >
    {children}
  </div>
);

