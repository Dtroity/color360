import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика использования cookie | HiWatch',
  description: 'Политика использования файлов cookie на сайте',
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Политика использования cookie</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Что такое cookie?</h2>
          <p className="mb-4">
            Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве 
            (компьютере, планшете или мобильном телефоне) при посещении веб-сайта. Cookie 
            позволяют сайту запоминать ваши действия и предпочтения на определенный период 
            времени, чтобы вам не нужно было вводить их заново при возвращении на сайт или 
            переходе с одной страницы на другую.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Какие cookie мы используем?</h2>
          <p className="mb-4">
            На нашем сайте используются следующие типы cookie:
          </p>
          
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Необходимые cookie</h3>
            <p className="mb-2">
              Эти cookie необходимы для работы сайта и не могут быть отключены. Они обычно 
              устанавливаются в ответ на ваши действия, такие как вход в систему или заполнение форм.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Функциональные cookie</h3>
            <p className="mb-2">
              Эти cookie позволяют сайту запоминать сделанные вами выборы (например, язык, 
              регион) и предоставлять улучшенные персонализированные функции.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Аналитические cookie</h3>
            <p className="mb-2">
              Эти cookie помогают нам понять, как посетители взаимодействуют с сайтом, собирая 
              и передавая информацию анонимно. Это позволяет нам улучшать работу сайта.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Маркетинговые cookie</h3>
            <p className="mb-2">
              Эти cookie используются для отслеживания посетителей на разных сайтах с целью 
              показа релевантной рекламы.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Управление cookie</h2>
          <p className="mb-4">
            Вы можете управлять cookie через настройки вашего браузера. Большинство браузеров 
            позволяют вам:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Просматривать cookie, хранящиеся на вашем устройстве</li>
            <li>Удалять cookie</li>
            <li>Блокировать cookie</li>
            <li>Блокировать cookie с определенных сайтов</li>
            <li>Блокировать все cookie</li>
            <li>Удалять все cookie при закрытии браузера</li>
          </ul>
          <p className="mb-4">
            Обратите внимание, что отключение cookie может повлиять на функциональность сайта 
            и ограничить доступ к некоторым функциям.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Cookie третьих сторон</h2>
          <p className="mb-4">
            На нашем сайте могут использоваться cookie третьих сторон для аналитики и маркетинга. 
            Эти cookie устанавливаются сторонними сервисами, такими как Google Analytics, 
            Яндекс.Метрика и другие.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Согласие на использование cookie</h2>
          <p className="mb-4">
            Продолжая использовать наш сайт, вы соглашаетесь с использованием cookie в соответствии 
            с настоящей Политикой. Вы можете отозвать свое согласие в любое время, изменив настройки 
            браузера или удалив сохраненные cookie.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Контактная информация</h2>
          <p className="mb-4">
            По вопросам использования cookie вы можете обратиться:
          </p>
          <ul className="list-none pl-0 mb-4">
            <li><strong>ИП Визе В.Н.</strong></li>
            <li><strong>ИНН:</strong> 781452869091</li>
            <li><strong>Email:</strong> info@color360.ru</li>
          </ul>
        </section>

        <section className="mb-8">
          <p className="text-sm text-gray-600">
            Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </section>
      </div>
    </div>
  );
}

