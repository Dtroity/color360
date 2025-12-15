import { HeroSection } from "@/components/home/HeroSection";
import { PopularBrands } from "@/components/home/PopularBrands";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const sellingPoints = [
  {
    title: "Экспресс-проектирование",
    description:
      "Сметы и схемы подключения за 48 часов, выезд инженера в пределах КАД.",
  },
  {
    title: "Инсталляция под ключ",
    description:
      "Монтаж, настройка удалённого доступа и обучение персонала.",
  },
  {
    title: "Поддержка 24/7",
    description:
      "Сервисные контракты и удалённый мониторинг оборудования.",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularBrands />
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {sellingPoints.map((point) => (
            <Card key={point.title}>
              <h3 className="font-display text-lg font-semibold text-neutral-900">
                {point.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                {point.description}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-dashed border-primary-200 bg-primary-50/80 px-6 py-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary-600">
              Индивидуальное предложение
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-neutral-900">
              Получите первичный расчёт проекта бесплатно
            </h3>
          </div>
          <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
            Заполнить бриф
          </Button>
        </div>
      </section>
    </>
  );
}

