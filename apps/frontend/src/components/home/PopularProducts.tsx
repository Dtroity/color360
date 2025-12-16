"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { API_BASE_URL } from "@/shared/config/api";
import { Product } from "@/shared/api/catalog";

/**
 * Компонент блока "Популярные товары"
 * Отображает товары в автоматическом или ручном режиме
 */
export const PopularProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Используем новый endpoint для популярных товаров
        const response = await fetch(`${API_BASE_URL}/api/popular-products`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка загрузки популярных товаров:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">
              Популярные товары
            </h2>
            <p className="text-sm text-neutral-500">
              Официальные поставки и расширенная гарантия
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Популярные товары
          </h2>
          <p className="text-sm text-neutral-500">
            Официальные поставки и расширенная гарантия
          </p>
        </div>
        <Link
          href="/catalog"
          className="text-sm font-semibold text-primary-600 hover:text-primary-500"
        >
          Все товары →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const mainImage = product.images?.[0]?.url || "/placeholder-product.svg";
  const productUrl = `/product/${product.slug || product.id}`;

  return (
    <motion.div whileHover={{ scale: 1.03 }}>
      <Link href={productUrl}>
        <Card className="group flex h-48 cursor-pointer flex-col overflow-hidden border border-neutral-100 hover:border-primary-200">
          <div className="relative flex-1 bg-neutral-50">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-contain p-2 transition group-hover:scale-105"
              onError={({ currentTarget }) => {
                currentTarget.src = "/placeholder-product.svg";
              }}
            />
          </div>
          <div className="border-t border-neutral-100 bg-white p-3">
            <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
              {product.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base font-bold text-primary-600">
                {product.price.toLocaleString("ru-RU")} {product.currency || "₽"}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  {product.oldPrice.toLocaleString("ru-RU")} ₽
                </span>
              )}
            </div>
            {product.stock > 0 ? (
              <span className="mt-1 inline-block text-xs text-green-600">
                В наличии
              </span>
            ) : (
              <span className="mt-1 inline-block text-xs text-red-600">
                Нет в наличии
              </span>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

