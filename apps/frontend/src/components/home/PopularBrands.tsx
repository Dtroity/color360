"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

const brands = [
  { name: "HiWatch", slug: "hiwatch" },
  { name: "Hikvision", slug: "hikvision" },
  { name: "Dahua", slug: "dahua" },
  { name: "Ajax Systems", slug: "ajax" },
  { name: "Uniview", slug: "uniview" },
  { name: "EZVIZ", slug: "ezviz" },
  { name: "Tiandy", slug: "tiandy" },
  { name: "Beward", slug: "beward" },
];

export const PopularBrands = () => (
  <section className="mx-auto mt-16 max-w-6xl px-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">
          Популярные устройства
        </h2>
        <p className="text-sm text-neutral-500">
          Официальные поставки и расширенная гарантия
        </p>
      </div>
      <Link
        href="/brands"
        className="text-sm font-semibold text-primary-600 hover:text-primary-500"
      >
        Все бренды →
      </Link>
    </div>

    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {brands.map((brand) => (
        <BrandCard key={brand.slug} {...brand} />
      ))}
    </div>
  </section>
);

const BrandCard = ({ name, slug }: { name: string; slug: string }) => (
  <motion.div whileHover={{ scale: 1.03 }}>
    <Card className="group flex h-36 cursor-pointer flex-col items-center justify-center gap-3 border border-neutral-100 text-center hover:border-primary-200">
      <div className="relative h-12 w-24">
        <Image
          src={`/uploads/brands/${slug}.svg`}
          alt={name}
          fill
          sizes="96px"
          className="object-contain opacity-90 transition group-hover:opacity-100"
          onError={({ currentTarget }) => {
            currentTarget.style.display = "none";
          }}
        />
      </div>
      <span className="text-sm font-semibold text-neutral-900">{name}</span>
    </Card>
  </motion.div>
);

