"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, Popover, Transition } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignRight,
  ChevronDown,
  Heart,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import CartDropdown from "./CartDropdown";
import { useCartStore } from "@/store/useCart";

const catalogCategories = [
  "IP-камеры",
  "TVI-камеры",
  "Видеорегистраторы",
  "Домофония",
  "Контроль доступа",
  "Аксессуары",
];

const navLinks = [
  { label: "Производители", href: "/brands" },
  { label: "Доставка и оплата", href: "/delivery" },
  { label: "Контакты", href: "/contact" },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 24);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isScrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0)",
        boxShadow: isScrolled
          ? "0 8px 30px rgba(15, 23, 42, 0.08)"
          : "0 0 0 rgba(0,0,0,0)",
      }}
      className="sticky top-0 z-50 border-b border-slate-200/40 backdrop-blur-md transition-shadow"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Открыть меню"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500">
              Системы видеонаблюдения
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <CatalogDropdown />
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <button
              className="rounded-full bg-neutral-100 p-2 text-neutral-600 transition hover:bg-primary-50 hover:text-primary-600"
              aria-label="Показать поиск"
              onClick={() => setShowSearch((prev) => !prev)}
            >
              <Search className="h-4 w-4" />
            </button>
            <ContactPhone />
          </div>
          <IconButtons />
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-200/60 bg-white/90 backdrop-blur"
          >
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className="w-full rounded-full border border-neutral-200 bg-white px-12 py-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Поиск по каталогу..."
                />
              </div>
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => setShowSearch(false)}
              >
                Скрыть
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      />
    </motion.header>
  );
};

const CatalogDropdown = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Закрыть меню при изменении роута
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Popover className="relative">
      <Popover.Button 
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
      >
        <AlignRight className="h-4 w-4 text-primary-500" />
        Каталог
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute left-0 z-20 mt-3 w-64 rounded-2xl border border-neutral-100 bg-white p-3 shadow-2xl ring-1 ring-black/5">
          <div className="space-y-1">
            {catalogCategories.map((category) => (
              <Link
                key={category}
                href={`/catalog/${encodeURIComponent(category)}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-2 text-sm text-neutral-700 transition hover:bg-primary-50 hover:text-primary-700"
              >
                <span>{category}</span>
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
            ))}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

const ContactPhone = () => (
  <a
    href="tel:+79888622271"
    className="flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
  >
    <Phone className="h-4 w-4" />
    +7 (988) 862-22-71
  </a>
);

const IconButtons = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalQuantity = useCartStore((s) => s.getTotalQuantity());

  return (
    <div className="flex items-center gap-1">
      <IconWithBadge icon={<Star className="h-4 w-4" />} label="Сравнение" />
      <IconWithBadge icon={<Heart className="h-4 w-4" />} label="Избранное" />
      <div className="relative">
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Корзина"
        >
          <ShoppingCart className="w-6 h-6" />
          {totalQuantity > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalQuantity}
            </span>
          )}
        </button>
        {isCartOpen && (
          <CartDropdown onClose={() => setIsCartOpen(false)} />
        )}
      </div>
    </div>
  );
};

type IconWithBadgeProps = {
  icon: React.ReactNode;
  label: string;
  badgeContent?: string;
  description?: string;
};

const IconWithBadge = ({
  icon,
  label,
  badgeContent,
  description,
}: IconWithBadgeProps) => (
  <Button
    variant="ghost"
    size="icon"
    aria-label={label}
    className="relative rounded-full border border-transparent text-neutral-600 hover:border-neutral-200 hover:bg-neutral-100"
  >
    {icon}
    {badgeContent && (
      <Badge className="absolute -right-1 -top-1" variant="alert">
        {badgeContent}
      </Badge>
    )}
    {description && (
      <span className="sr-only">{`${label} на сумму ${description}`}</span>
    )}
  </Button>
);

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => (
  <Dialog open={isOpen} onClose={onClose} className="relative z-50 lg:hidden">
    <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
    <div className="fixed inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-neutral-500">
            Профессиональные системы
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-neutral-100 p-2"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Каталог
          </p>
          <div className="mt-2 space-y-2">
            {catalogCategories.map((category) => (
              <Link
                key={category}
                href={`/catalog/${encodeURIComponent(category)}`}
                className="block rounded-xl border border-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-primary-200 hover:bg-primary-50/60"
                onClick={onClose}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Навигация
          </p>
          <div className="mt-2 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase text-neutral-500">
            +7 (988) 862-22-71
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Бесплатная консультация инженера
          </p>
          <Button className="mt-3 w-full">Заказать звонок</Button>
        </div>
      </div>
    </div>
  </Dialog>
);

