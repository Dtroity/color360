import React from 'react';
import type { Metadata } from 'next';
import { ContactsMap } from '@/components/ContactsMap';

export const metadata: Metadata = {
  title: 'Контакты — HiWatch',
  description: 'Свяжитесь с нами. Телефон, адрес, режим работы.',
};

export default function ContactPage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Контакты</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-xl font-semibold mb-4">Наш офис</h2>
          <div className="space-y-3 text-neutral-600">
            <p>
              <strong>Адрес:</strong><br />
              г. Санкт-Петербург, Невский проспект, д. 1, оф. 101
            </p>
            <p>
              <strong>Телефон:</strong><br />
              <a href="tel:+79888622271" className="text-primary-600 hover:text-primary-700">
                +7 (988) 862-22-71
              </a>
            </p>
            <p>
              <strong>Telegram:</strong><br />
              <a href="https://t.me/c0l0r360" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                t.me/c0l0r360
              </a>
            </p>
            <p>
              <strong>Email:</strong><br />
              <a href="mailto:info@color360.ru" className="text-primary-600 hover:text-primary-700">
                info@color360.ru
              </a>
            </p>
            <p>
              <strong>Режим работы:</strong><br />
              Пн-Сб: 9:00 - 19:00<br />
                Вс: выходной
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Как нас найти</h2>
          <p className="text-neutral-600 mb-4">
            Наш офис расположен в центре Санкт-Петербурга, в шаговой доступности от станции метро.
            Телеграм для связи: <a href="https://t.me/c0l0r360" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">@c0l0r360</a>.
          </p>
          <p className="text-neutral-600">
            Вы можете посетить наш шоурум для консультации и просмотра образцов оборудования.
          </p>
        </div>
      </div>

      <div className="h-96 rounded-lg overflow-hidden">
        <ContactsMap
          center={[59.9343, 30.3351]}
          address="г. Санкт-Петербург, Невский проспект, д. 1, оф. 101"
          phone="+79888622271"
          hours="Пн-Пт: 9:00 - 18:00"
        />
      </div>
    </section>
  );
}
