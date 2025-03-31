import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">О нас</h1>
      <p className="text-gray-700 mb-4">Магазин <strong>УДача</strong> — ваш надёжный помощник в садоводстве!</p>
      <p className="text-gray-700 mb-4">Мы предлагаем широкий ассортимент семян, инструментов и удобрений для вашего сада и огорода.</p>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Контакты</h2>
      <p className="text-gray-700">Адрес: г. Михайловск, заезд Климова 41/2</p>
      <p className="text-gray-700">Телефон: +7 (999) 123-45-67</p>
      <p className="text-gray-700">Email: udacha@example.com</p>
      <div className="mt-6 w-full">
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <a
            href="https://yandex.ru/maps/org/udacha/238093748518/?utm_medium=mapframe&utm_source=maps"
            style={{ color: '#eee', fontSize: '12px', position: 'absolute', top: '0px' }}
          >
            Удача
          </a>
          <a
            href="https://yandex.ru/maps/101271/mikhaylovsk/category/seed_shop/184108053/?utm_medium=mapframe&utm_source=maps"
            style={{ color: '#eee', fontSize: '12px', position: 'absolute', top: '14px' }}
          >
            Магазин семян в Михайловске
          </a>
          <iframe
            src="https://yandex.ru/map-widget/v1/org/udacha/238093748518/?ll=42.033933%2C45.150902&z=16"
            width="100%"
            height="400"
            frameBorder="1"
            allowFullScreen={true}
            style={{ position: 'relative' }}
            title="Карта магазина УДача на Яндекс.Картах"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default About;