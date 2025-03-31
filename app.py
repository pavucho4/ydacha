import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import asyncio
from telegram import Bot

app = Flask(__name__, static_folder='frontend/static', template_folder='frontend')
CORS(app)

# Конфигурация
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['TELEGRAM_BOT_TOKEN'] = os.getenv('TELEGRAM_BOT_TOKEN')
app.config['TELEGRAM_CHAT_ID'] = os.getenv('TELEGRAM_CHAT_ID')

# Telegram-бот
bot = Bot(token=app.config['TELEGRAM_BOT_TOKEN'])
loop = asyncio.get_event_loop()

# JSON-файлы
PRODUCTS_FILE = 'products.json'
ORDERS_FILE = 'orders.json'
USERS_FILE = 'users.json'

# Инициализация данных
if not os.path.exists(PRODUCTS_FILE):
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump([], f)
if not os.path.exists(ORDERS_FILE):
    with open(ORDERS_FILE, 'w') as f:
        json.dump([], f)
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as f:
        json.dump([{'username': 'admin', 'password_hash': generate_password_hash('admin123')}], f)

def check_auth():
    auth = request.authorization
    if not auth or not auth.username or not auth.password:
        return False
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)
    user = next((u for u in users if u['username'] == auth.username), None)
    return user and check_password_hash(user['password_hash'], auth.password)

def send_order_to_bot(order_text):
    try:
        loop.run_until_complete(bot.send_message(chat_id=app.config['TELEGRAM_CHAT_ID'], text=order_text))
        print(f"Успешно отправлено: {order_text}")
    except Exception as e:
        print(f"Ошибка Telegram: {e}")

@app.route('/api/products', methods=['GET'])
def get_products():
    with open(PRODUCTS_FILE, 'r') as f:
        products = json.load(f)
    return jsonify([p for p in products if p['quantity'] > 0])

@app.route('/api/products', methods=['POST'])
def add_product():
    if not check_auth():
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    data = request.form
    file = request.files.get('photo')
    if not data.get('name') or not data.get('price') or not data.get('quantity'):
        return jsonify({'error': 'Отсутствуют обязательные поля'}), 400
    
    photo_filename = None
    if file:
        photo_filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))

    with open(PRODUCTS_FILE, 'r') as f:
        products = json.load(f)
    
    product_id = max([p['id'] for p in products], default=0) + 1
    product = {
        'id': product_id,
        'name': data['name'],
        'description': data.get('description', ''),
        'price': float(data['price']),
        'quantity': int(data['quantity']),
        'photo': photo_filename,
        'category': data.get('category', 'Без категории')
    }
    products.append(product)
    
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump(products, f)
    
    return jsonify({'message': 'Товар добавлен', 'id': product_id}), 201

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path.startswith('api') or path.startswith('static'):
        return jsonify({'error': 'Not found'}), 404
    if os.path.exists(os.path.join(app.template_folder, path)):
        return send_from_directory(app.template_folder, path)
    return send_from_directory(app.template_folder, 'index.html')

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    port = int(os.getenv('PORT', 10000))  # Render использует PORT
    app.run(host='0.0.0.0', port=port)
