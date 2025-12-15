'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/products/create');
  }, [router]);

  return (
    <div className="p-4">
      <p className="text-gray-600">Перенаправление...</p>
    </div>
  );
}

