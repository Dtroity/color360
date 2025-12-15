import type { ReactNode } from "react";

// Групповой layout теперь не создает <html>/<body>, чтобы избежать дублирования.
export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}

