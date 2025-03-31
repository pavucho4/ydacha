const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch'); // Добавьте для Telegram

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// Временный маршрут для проверки и создания таблицы orders
app.get('/api/check-orders-table', async (req, res) => {
  try {
    const check = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders')"
    );
    if (!check.rows[0].exists) {
      await pool.query(`
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          items JSONB NOT NULL,
          desired_datetime TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Created orders table');
    }
    res.json({ status: 'Orders table OK', exists: check.rows[0].exists });
  } catch (err) {
    console.error('Check orders table error:', err.stack);
    res.status(500).json({ error: 'Failed to check/create orders table', details: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/products error:', err.stack);
    res.status(500).json({ error: 'Ошибка загрузки товаров', details: err.message });
  }
});

app.post('/api/products', upload.single('photo'), async (req, res) => {
  const { name, description, price, quantity, category } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  console.log('Received data:', { name, description, price, quantity, category, photo });

  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, quantity, category, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, parseFloat(price), parseInt(quantity), category, photo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/products error:', err.stack);
    res.status(500).json({ error: 'Ошибка добавления товара', details: err.message });
  }
});

app.put('/api/products/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, category } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  console.log('Updating product:', { id, name, description, price, quantity, category, photo });

  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, quantity = $4, category = $5, photo = COALESCE($6, photo) WHERE id = $7 RETURNING *',
      [name, description, parseFloat(price), parseInt(quantity), category, photo, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/products error:', err.stack);
    res.status(500).json({ error: 'Ошибка обновления товара', details: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/products error:', err.stack);
    res.status(500).json({ error: 'Ошибка удаления', details: err.message });
  }
});

let cart = [];
app.get('/api/cart', (req, res) => res.json(cart));
app.post('/api/cart', (req, res) => {
  const product = req.body;
  cart.push(product);
  res.status(201).json(product);
});
app.delete('/api/cart/:id', (req, res) => {
  const { id } = req.params;
  cart = cart.filter(item => item.id !== parseInt(id));
  res.status(204).send();
});

app.post('/api/orders', async (req, res) => {
  const { customer_name, phone, items, desired_datetime } = req.body;
  console.log('Order data:', { customer_name, phone, items, desired_datetime });

  try {
    const result = await pool.query(
      'INSERT INTO orders (customer_name, phone, items, desired_datetime) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_name, phone, JSON.stringify(items), desired_datetime]
    );

    // Отправка в Telegram
    const telegramToken = '7905338411:AAFI1v_5NXSS-qCOwbiei4tKs28_pLHt0pc'; // Замените на токен вашего бота
    const chatId = '709914926'; // Замените на ваш chat_id
    const message = `Новый заказ:\nИмя: ${customer_name}\nТелефон: ${phone}\nТовары: ${JSON.stringify(items, null, 2)}\nДата: ${desired_datetime}`;
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/orders error:', err.stack);
    res.status(500).json({ error: 'Ошибка заказа', details: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));