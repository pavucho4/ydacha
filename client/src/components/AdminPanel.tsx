import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  photo: string | null;
  category: string;
}

const AdminPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    photo: null as File | null,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = () => {
    axios.get('/api/products', {
      auth: { username: 'admin', password: 'admin123' },
    })
      .then(response => {
        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);
      })
      .catch(error => console.error('Ошибка загрузки товаров:', error));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', newProduct.price);
    formData.append('quantity', newProduct.quantity);
    formData.append('category', newProduct.category);
    if (newProduct.photo) {
      formData.append('photo', newProduct.photo);
    }

    console.log('Sending FormData:', Object.fromEntries(formData)); // Отладка

    axios.post('/api/products', formData, {
      auth: { username: 'admin', password: 'admin123' },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(response => {
        console.log('Товар добавлен:', response.data);
        setNewProduct({ name: '', description: '', price: '', quantity: '', category: '', photo: null });
        fetchProducts();
      })
      .catch(error => {
        console.error('Ошибка добавления товара:', error.response?.data || error.message);
      });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData();
    formData.append('id', editingProduct.id.toString());
    formData.append('name', editingProduct.name);
    formData.append('description', editingProduct.description);
    formData.append('price', editingProduct.price.toString());
    formData.append('quantity', editingProduct.quantity.toString());
    formData.append('category', editingProduct.category);
    if (newProduct.photo) {
      formData.append('photo', newProduct.photo);
    }

    console.log('Updating FormData:', Object.fromEntries(formData)); // Отладка

    axios.post('/api/products', formData, {
      auth: { username: 'admin', password: 'admin123' },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then(() => {
        setEditingProduct(null);
        setNewProduct({ name: '', description: '', price: '', quantity: '', category: '', photo: null });
        fetchProducts();
      })
      .catch(error => {
        console.error('Ошибка обновления товара:', error.response?.data || error.message);
      });
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      axios.delete(`/api/products/${id}`, {
        auth: { username: 'admin', password: 'admin123' },
      })
        .then(() => {
          fetchProducts();
        })
        .catch(error => console.error('Ошибка удаления товара:', error));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Вход в админ-панель</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">Админ-панель</h2>
        <button onClick={handleLogout} className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700">
          Выйти
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-12">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Добавить товар</h3>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            placeholder="Название"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            placeholder="Описание"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <input
            type="number"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            placeholder="Цена"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
          <input
            type="number"
            value={newProduct.quantity}
            onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
            placeholder="Количество"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
          <input
            type="text"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            placeholder="Категория"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            required
          />
          <input
            type="file"
            onChange={(e) => setNewProduct({ ...newProduct, photo: e.target.files?.[0] || null })}
            className="w-full p-3 border rounded-lg"
          />
          <button type="submit" className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">
            Добавить
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-lg shadow-md">
            {product.photo && <img src={product.photo} alt={product.name} className="w-full h-48 object-cover rounded-t-lg mb-4" />}
            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-green-600 font-bold">Цена: {product.price} руб.</p>
            <p className="text-gray-500">Количество: {product.quantity} шт.</p>
            <p className="text-gray-500">Категория: {product.category}</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => handleEditProduct(product)}
                className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Редактировать товар</h3>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <textarea
                value={editingProduct.description}
                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <input
                type="number"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <input
                type="number"
                value={editingProduct.quantity}
                onChange={(e) => setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value) })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <input
                type="text"
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <input
                type="file"
                onChange={(e) => setNewProduct({ ...newProduct, photo: e.target.files?.[0] || null })}
                className="w-full p-3 border rounded-lg"
              />
              <div className="space-x-2">
                <button type="submit" className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">
                  Сохранить
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;