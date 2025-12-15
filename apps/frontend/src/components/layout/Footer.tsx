import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Shield,
  Timer,
  Truck,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const catalogLinks = [
  { label: "IP-камеры", href: "/catalog/ip" },
  { label: "TVI-камеры", href: "/catalog/tvi" },
  { label: "Видеорегистраторы", href: "/catalog/dvr" },
  { label: "Домофония", href: "/catalog/domofoniya" },
  { label: "Контроль доступа", href: "/catalog/access" },
  { label: "Аксессуары", href: "/catalog/accessories" },
];

const infoLinks = [
  { label: "О компании", href: "/about" },
  { label: "Доставка и оплата", href: "/delivery" },
  { label: "Гарантия и возврат", href: "/warranty" },
  { label: "Контакты", href: "/contact" },
];

export const Footer = () => (
  <footer className="mt-16 border-t border-neutral-200 bg-neutral-900 text-neutral-100">
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-4">
        <div>
          <p className="font-display text-xl font-semibold text-primary-100">
            ИП Визе В.Н.
          </p>
          <p className="text-sm text-neutral-300">
            Профессиональные системы видеонаблюдения для дома и бизнеса
          </p>
        </div>
        <div className="flex gap-3">
          <SocialIcon href="https://t.me/color360" icon={<Send />} label="Telegram" />
          <SocialIcon href="https://wa.me/79999999999" icon={<MessageCircle />} label="WhatsApp" />
          <SocialIcon href="https://vk.com" icon={<Shield />} label="VK" />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Каталог
        </p>
        <nav className="mt-4 space-y-2">
          {catalogLinks.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </nav>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Информация
        </p>
        <nav className="mt-4 space-y-2">
          {infoLinks.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </nav>
      </div>

      <div className="space-y-3 text-sm text-neutral-300">
        <FooterContact icon={<MapPin />} text="г. Санкт-Петербург" />
        <FooterContact icon={<Phone />} text="+7 (988) 862-22-71" />
        <FooterContact icon={<Mail />} text="info@color360.ru" />
        <FooterContact icon={<Timer />} text="Пн-Сб 09:00 — 19:00" />
        <FooterContact icon={<Truck />} text="Доставка по всей России" />
        <Button variant="secondary" className="mt-2 w-full justify-center bg-primary-600 text-white hover:bg-primary-500">
          Заказать консультацию
        </Button>
      </div>
    </div>

    <div className="border-t border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2024 ИП Визе В.Н. Все права защищены</p>
        <p>ИНН 781452869091</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy-policy" className="hover:text-neutral-200">
            Политика конфиденциальности
          </Link>
          <Link href="/cookie-policy" className="hover:text-neutral-200">
            Политика cookie
          </Link>
          <Link href="/terms" className="hover:text-neutral-200">
            Пользовательское соглашение
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

const SocialIcon = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <Link
    href={href}
    aria-label={label}
    className="rounded-full border border-neutral-700 p-2 text-neutral-200 transition hover:border-primary-400 hover:text-primary-200"
  >
    {icon}
  </Link>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="block text-neutral-300 transition hover:text-white"
  >
    {children}
  </Link>
);

const FooterContact = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div className="flex items-center gap-3">
    <span className="text-primary-300">{icon}</span>
    <span>{text}</span>
  </div>
);

