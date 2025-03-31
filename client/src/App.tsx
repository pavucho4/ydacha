import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductList from './components/ProductList';
import OrderForm from './components/OrderForm';
import AdminPanel from './components/AdminPanel';
import About from './components/About';
import { FaHome, FaShoppingCart, FaInfoCircle, FaSearch, FaBars } from 'react-icons/fa';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slides = [
    'https://images.pexels.com/photos/1397910/pexels-photo-1397910.jpeg',
    'https://images.pexels.com/photos/2294477/pexels-photo-2294477.jpeg',
    'https://images.pexels.com/photos/209339/pexels-photo-209339.jpeg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => setCart(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching cart:', err));
  }, []);

  const addToCart = async (product: { id: number; name: string; price: number; quantity: number; image?: string }) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (response.ok) {
        setCart(prev => {
          const existingItem = prev.find(item => item.id === product.id);
          if (existingItem) {
            return prev.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...prev, { ...product, quantity: 1 }];
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const removeFromCart = async (id: number) => {
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setCart(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const clearCart = () => setCart([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/catalog?search=${searchQuery}`;
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow-md py-4 relative z-20">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-md md:text-4xl">
              <span className="text-green-600">У</span>
              <span className="text-orange-500">Д</span>ача
            </h1>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex md:items-center md:space-x-6">
                <Link to="/" className="text-gray-600 hover:text-green-600 flex items-center transition-colors text-base">
                  {/* @ts-ignore */}
                  <FaHome className="mr-1" /> Главная
                </Link>
                <Link to="/catalog" className="text-gray-600 hover:text-green-600 flex items-center transition-colors text-base">
                  {/* @ts-ignore */}
                  <FaShoppingCart className="mr-1" /> Каталог
                </Link>
                <Link to="/about" className="text-gray-600 hover:text-green-600 flex items-center transition-colors text-base">
                  {/* @ts-ignore */}
                  <FaInfoCircle className="mr-1" /> О нас
                </Link>
              </nav>
              <div className="hidden md:flex items-center space-x-4">
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск..."
                    className="p-2 h-10 border rounded-l-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 w-40"
                  />
                  <button type="submit" className="p-2 h-10 bg-gray-200 text-gray-600 rounded-r-lg hover:bg-gray-300">
                    {/* @ts-ignore */}
                    <FaSearch />
                  </button>
                </form>
                <Link
                  to="/order"
                  className="relative bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-transform transform hover:scale-105 shadow-md text-base"
                >
                  {/* @ts-ignore */}
                  <FaShoppingCart className="mr-2" />
                  Корзина
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Link>
              </div>
              <div className="flex items-center space-x-2 md:hidden">
                <Link to="/order" className="relative text-green-600 hover:text-green-700">
                  {/* @ts-ignore */}
                  <FaShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Link>
                <button onClick={toggleMenu} className="text-gray-600 hover:text-green-600">
                  {/* @ts-ignore */}
                  <FaBars size={24} />
                </button>
              </div>
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex justify-center mt-2 md:hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="p-2 border rounded-l-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600 w-3/4"
            />
            <button type="submit" className="p-2 bg-gray-200 text-gray-600 rounded-r-lg hover:bg-gray-300">
              {/* @ts-ignore */}
              <FaSearch />
            </button>
          </form>
          <nav className={`${isMenuOpen ? 'flex' : 'hidden'} flex-col items-end space-y-4 fixed top-16 right-0 w-2/3 h-full p-4 z-30 transition-transform transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}>
            <Link to="/" className="text-gray-600 hover:text-green-600 flex items-center transition-colors text-base bg-white px-3 py-2 rounded-md w-32" onClick={() => setIsMenuOpen(false)}>
              {/* @ts-ignore */}
              <FaHome className="mr-1" /> Главная
            </Link>
            <Link to="/catalog" className="text-gray-600 hover:text-green-600 flex items-center transition-colors text-base bg-white px-3 py-2 rounded-md w-32" onClick={() => setIsMenuOpen(false)}>
              {/* @ts-ignore */}
              <FaShoppingCart className="mr-1" /> Каталог
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-green-600 flex items-center transition-colors text-base bg-white px-3 py-2 rounded-md w-32" onClick={() => setIsMenuOpen(false)}>
              {/* @ts-ignore */}
              <FaInfoCircle className="mr-1" /> О нас
            </Link>
          </nav>
        </header>

        <section className="bg-gray-200 py-8 md:py-16 text-center relative z-10">
          <div className="relative w-full h-48 md:h-64">
            {slides.map((slide, index) => (
              <img
                key={index}
                src={slide}
                alt={`Slide ${index} - Сад и огород`}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800">
              <div className="bg-white bg-opacity-80 p-3 rounded-lg shadow-md md:p-4">
                <h2 className="text-2xl font-bold mb-2 drop-shadow-lg md:text-4xl">Всё для вашего сада!</h2>
                <p className="text-base text-gray-700 drop-shadow-md md:text-lg">Семена, инструменты и удобрения в УДача</p>
              </div>
            </div>
          </div>
        </section>

        <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex-1 bg-gray-100 relative z-10">
          <Routes>
            <Route path="/" element={
              <>
                <ProductList addToCart={addToCart} cart={cart} clearCart={clearCart} isPopular />
                <div className="text-center mt-6">
                  <Link
                    to="/catalog"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 shadow-md text-base"
                  >
                    Перейти в каталог
                  </Link>
                </div>
              </>
            } />
            <Route path="/catalog" element={<ProductList addToCart={addToCart} cart={cart} clearCart={clearCart} />} />
            <Route path="/order" element={<OrderForm cart={cart} clearCart={clearCart} removeFromCart={removeFromCart} />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/about" element={<About />} />
          </Routes>

          <section className="mt-8 md:mt-16">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 md:text-2xl md:mb-6">Специальные предложения</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow md:p-6">
                <img src="https://via.placeholder.com/300x150" alt="Акция" className="w-full h-32 object-cover rounded-t-lg mb-4 md:h-40" />
                <h3 className="text-lg font-semibold text-gray-800 md:text-xl">Скидка 20%</h3>
                <p className="text-gray-600 text-sm md:text-base">На все семена до конца месяца</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow md:p-6">
                <img src="https://via.placeholder.com/300x150" alt="Акция" className="w-full h-32 object-cover rounded-t-lg mb-4 md:h-40" />
                <h3 className="text-lg font-semibold text-gray-800 md:text-xl">2+1 бесплатно</h3>
                <p className="text-gray-600 text-sm md:text-base">Третий пакет семян в подарок</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow md:p-6">
                <img src="https://via.placeholder.com/300x150" alt="Акция" className="w-full h-32 object-cover rounded-t-lg mb-4 md:h-40" />
                <h3 className="text-lg font-semibold text-gray-800 md:text-xl">Скидка на самовывоз</h3>
                <p className="text-gray-600 text-sm md:text-base">При заказе от 1000 руб.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-gray-700 text-gray-200 py-6 md:py-8 relative z-10">
          <div className="container mx-auto px-4 text-center md:px-6">
            <p className="text-sm md:text-base">© 2025 УДача. Все права защищены.</p>
            <p className="mt-2 text-xs md:text-sm">г. Михайловск, заезд Климова 41/2 | Телефон: +7 (999) 123-45-67</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;