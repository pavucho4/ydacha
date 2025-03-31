const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

// Настройка multer для загрузки файлов
const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Статические файлы фронтенда
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// API маршруты
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json([]);
  }
});

app.post('/api/products', upload.single('photo'), async (req, res) => {
  const { name, description, price, quantity, category } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, quantity, category, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, parseFloat(price), parseInt(quantity), category, photo]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'Ошибка добавления товара' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/products error:', err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

let cart = [];
app.get('/api/cart', (req, res) => {
  res.json(cart);
});

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
  try {
    const result = await pool.query(
      'INSERT INTO orders (customer_name, phone, items, desired_datetime) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_name, phone, JSON.stringify(items), desired_datetime]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Ошибка заказа' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));