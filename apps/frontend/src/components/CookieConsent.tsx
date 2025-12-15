'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, дал ли пользователь согласие
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Показываем баннер через небольшую задержку для лучшего UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Мы используем файлы cookie и другие технологии для улучшения работы сайта, 
              персонализации контента и анализа трафика. Продолжая использовать сайт, 
              вы соглашаетесь с{' '}
              <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                Политикой конфиденциальности
              </Link>
              {' '}и{' '}
              <Link href="/cookie-policy" className="text-blue-600 hover:text-blue-700 underline">
                Политикой использования cookie
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Отклонить
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Принять
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

