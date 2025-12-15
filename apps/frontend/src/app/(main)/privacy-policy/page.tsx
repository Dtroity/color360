import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности | HiWatch',
  description: 'Политика конфиденциальности и обработки персональных данных',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Политика конфиденциальности</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Общие положения</h2>
          <p className="mb-4">
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
            персональных данных пользователей сайта www.color360.ru (далее — «Сайт»), 
            принадлежащего ИП Визе В.Н. (далее — «Оператор»).
          </p>
          <p className="mb-4">
            Используя Сайт, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Персональные данные</h2>
          <p className="mb-4">
            Оператор собирает следующие персональные данные:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Фамилия, имя, отчество</li>
            <li>Номер телефона</li>
            <li>Адрес электронной почты</li>
            <li>Адрес доставки</li>
            <li>Данные платежных карт (обрабатываются платежными системами)</li>
            <li>IP-адрес и данные cookies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Цели обработки персональных данных</h2>
          <p className="mb-4">
            Оператор обрабатывает персональные данные в следующих целях:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Обработка и выполнение заказов</li>
            <li>Доставка товаров</li>
            <li>Связь с клиентами по вопросам заказов</li>
            <li>Информирование о новых товарах и акциях</li>
            <li>Улучшение качества обслуживания</li>
            <li>Соблюдение требований законодательства</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Правовые основания обработки</h2>
          <p className="mb-4">
            Обработка персональных данных осуществляется на основании:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»</li>
            <li>Согласия субъекта персональных данных</li>
            <li>Договора, стороной которого является субъект персональных данных</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Сроки хранения персональных данных</h2>
          <p className="mb-4">
            Персональные данные хранятся в течение срока, необходимого для достижения целей 
            обработки, или в течение срока, установленного законодательством Российской Федерации.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Права субъектов персональных данных</h2>
          <p className="mb-4">
            Вы имеете право:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Получать информацию об обработке ваших персональных данных</li>
            <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
            <li>Отозвать согласие на обработку персональных данных</li>
            <li>Обжаловать действия Оператора в уполномоченном органе</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Меры по защите персональных данных</h2>
          <p className="mb-4">
            Оператор принимает необходимые правовые, организационные и технические меры для 
            защиты персональных данных от неправомерного доступа, уничтожения, изменения, 
            блокирования, копирования, предоставления, распространения, а также от иных 
            неправомерных действий.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Контактная информация</h2>
          <p className="mb-4">
            По вопросам обработки персональных данных вы можете обратиться:
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

