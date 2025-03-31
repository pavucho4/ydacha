import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface OrderFormProps {
  cart: CartItem[];
  clearCart: () => void;
  removeFromCart: (id: number) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ cart, clearCart, removeFromCart }) => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [desiredDate, setDesiredDate] = useState<string>('');
  const [desiredTime, setDesiredTime] = useState<string>('');
  const [minTime, setMinTime] = useState<string>('09:00');
  const [error, setError] = useState<string | null>(null);

  const availableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 1) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  useEffect(() => {
    if (desiredDate) {
      const now = new Date();
      const selectedDate = new Date(desiredDate);
      if (selectedDate.toDateString() === now.toDateString()) {
        const minDateTime = new Date(now.getTime() + 30 * 60000);
        const hours = minDateTime.getHours().toString().padStart(2, '0');
        const minutes = minDateTime.getMinutes().toString().padStart(2, '0');
        setMinTime(`${hours}:${minutes}`);
      } else {
        setMinTime('09:00');
      }
    }
  }, [desiredDate]);

  const validateDateTime = () => {
    if (!desiredDate || !desiredTime) return false;
    const now = new Date();
    const selectedDateTime = new Date(`${desiredDate}T${desiredTime}:00`);
    const minTimeDate = new Date(now.getTime() + 30 * 60000);
    const maxTime = new Date(`${desiredDate}T15:30:00`);
    return selectedDateTime >= minTimeDate && selectedDateTime <= maxTime;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0 && !value.startsWith('7')) {
      value = '7' + value;
    }
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    setPhone('+' + value);
  };

  const validatePhone = () => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 11;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Добавьте товары в корзину');
      return;
    }
    if (!validateDateTime()) {
      setError('Выберите дату и время с 9:00 до 15:30, минимум через 30 минут');
      return;
    }
    if (!validatePhone()) {
      setError('Номер телефона должен содержать 11 цифр (например, +79991234567)');
      return;
    }

    const orderData = {
      customer_name: customerName,
      phone,
      items: cart.map(item => ({ id: item.id, qty: item.quantity })),
      desired_datetime: `${desiredDate} ${desiredTime}:00`,
    };

    console.log('Sending order:', orderData);

    axios.post('/api/orders', orderData)
      .then(response => {
        console.log('Order submitted:', response.data);
        alert('Заказ успешно отправлен!');
        clearCart();
        navigate('/');
      })
      .catch(error => {
        console.error('Order submission error:', error.response?.data || error.message);
        setError(error.response?.data?.error || 'Ошибка при отправке заказа');
      });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Оформление заказа</h2>
      {cart.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ваша корзина:</h3>
          <ul className="space-y-2">
            {cart.map(item => (
              <li key={item.id} className="text-gray-700 flex justify-between items-center">
                <span>
                  {item.name} - {item.quantity} шт. ({item.price * item.quantity} руб.)
                </span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-800 font-semibold"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-semibold text-gray-800">
            Итого: {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)} руб.
          </p>
        </div>
      ) : (
        <p className="text-red-600 mb-6 text-center">Корзина пуста</p>
      )}
      {error && <p className="text-red-600 mb-6 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Имя</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Телефон</label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="+79991234567"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Желаемая дата</label>
          <select
            value={desiredDate}
            onChange={(e) => setDesiredDate(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          >
            <option value="">Выберите дату</option>
            {availableDates().map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Желаемое время</label>
          <input
            type="time"
            value={desiredTime}
            onChange={(e) => setDesiredTime(e.target.value)}
            min={minTime}
            max="15:30"
            step="300"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            Самовывоз: с 9:00 до 15:30 (кроме понедельника), минимум через 30 минут.
          </p>
        </div>
        <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">
          Отправить заказ
        </button>
      </form>
    </div>
  );
};

export default OrderForm;