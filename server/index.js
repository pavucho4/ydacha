const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Будет задано через Render
});

// Создание таблицы товаров (пример)
pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL NOT NULL,
    quantity INT NOT NULL,
    image VARCHAR(255)
  );
`).catch(err => console.error('Error creating table:', err));

// API для получения товаров в корзине
app.get('/api/cart', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// API для добавления товара в корзину
app.post('/api/cart', async (req, res) => {
  const { id, name, price, quantity, image } = req.body;
  try {
    await pool.query(
      'INSERT INTO products (id, name, price, quantity, image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET quantity = products.quantity + $4',
      [id, name, price, quantity, image]
    );
    res.status(201).send('Product added to cart');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Обслуживание статических файлов фронтенда
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});