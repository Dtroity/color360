"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/shared/utils/cn";

const slides = [
  {
    title: "Профессиональные системы видеонаблюдения",
    description:
      "Подберём оптимальное решение для дома, офиса и крупных объектов под ключ.",
    ctaLabel: "Каталог",
    ctaHref: "/catalog",
    accent: "Надёжность 24/7",
  },
  {
    title: "Бесплатная консультация инженера",
    description:
      "Запланируйте видеозвонок или выезд специалиста для точного расчёта проекта.",
    ctaLabel: "Заказать звонок",
    ctaHref: "/contact",
    accent: "Персональный подход",
  },
  {
    title: "Доставка по всей России",
    description:
      "Работаем со всеми службами доставки и обеспечиваем полную страховку груза.",
    ctaLabel: "Условия доставки",
    ctaHref: "/delivery",
    accent: "Скорость и контроль",
  },
];

export const HeroSection = () => {
  const [active, setActive] = useState(0);
  const currentSlide = useMemo(() => slides[active], [active]);

  return (
    <section className="mx-auto mt-6 max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-gradient-to-r from-primary-50 via-white to-accent-100 p-10 shadow-elevated lg:p-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-8">
            <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
              {currentSlide.accent}
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-display text-4xl font-semibold text-neutral-900 lg:text-5xl">
                  {currentSlide.title}
                </h1>
                <p className="mt-4 text-lg text-neutral-600">
                  {currentSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>
            <Button asChild size="lg">
              <a href={currentSlide.ctaHref}>{currentSlide.ctaLabel}</a>
            </Button>
          </div>

          <div className="relative">
            <motion.div
              key={currentSlide.ctaLabel}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="h-64 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.3),_transparent)] shadow-inner lg:h-80"
            >
              <div className="absolute inset-0 flex items-center justify-center text-primary-600">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                  className="h-48 w-48 rounded-full border border-dashed border-primary-200"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                  className="absolute h-32 w-32 rounded-full border border-dashed border-accent-200"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              onClick={() => setActive(index)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                index === active
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-transparent bg-white/70 text-neutral-600 hover:border-primary-200",
              )}
            >
              {slide.ctaLabel}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

