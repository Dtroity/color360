import { cn } from "@/shared/utils/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "info" | "alert";
  className?: string;
};

const styles = {
  info: "bg-primary-100 text-primary-700",
  alert: "bg-accent-500 text-white",
};

export const Badge = ({
  children,
  variant = "info",
  className,
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex min-w-[20px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
      styles[variant],
      className,
    )}
  >
    {children}
  </span>
);

