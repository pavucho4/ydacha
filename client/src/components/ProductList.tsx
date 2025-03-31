import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  photo: string | null;
  category: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface ProductListProps {
  addToCart: (product: Product) => void;
  cart: CartItem[];
  clearCart: () => void;
  isPopular?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ addToCart, cart, clearCart, isPopular }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    axios.get('/api/products')
      .then(response => {
        let filteredProducts = response.data;
        if (searchQuery) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (isPopular) {
          filteredProducts = filteredProducts.slice(0, 4);
        }
        setProducts(filteredProducts);
      })
      .catch(error => console.error('Ошибка загрузки товаров:', error));
  }, [searchQuery, isPopular]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isPopular ? 'Популярные товары' : 'Каталог товаров'}
        </h2>
        {!isPopular && (
          <button
            onClick={() => window.location.href = '/order'}
            className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18l-2 12H5L3 3zm4 16a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Корзина ({cart.length})
          </button>
        )}
      </div>
      {isPopular ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
              {product.photo ? (
                <img src={product.photo} alt={product.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Нет фото</span>
                </div>
              )}
              <div className="p-4">
                <h4 className="text-lg font-medium text-gray-800">{product.name}</h4>
                <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                <p className="text-green-600 font-bold mt-2">{product.price} руб.</p>
                <p className="text-gray-500 text-sm">В наличии: {product.quantity} шт.</p>
                <button
                  onClick={() => addToCart(product)}
                  className="mt-4 w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        categories.map(category => (
          <div key={category} className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">{category}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products
                .filter(product => product.category === category)
                .map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                    {product.photo ? (
                      <img src={product.photo} alt={product.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Нет фото</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="text-lg font-medium text-gray-800">{product.name}</h4>
                      <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                      <p className="text-green-600 font-bold mt-2">{product.price} руб.</p>
                      <p className="text-gray-500 text-sm">В наличии: {product.quantity} шт.</p>
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-4 w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProductList;