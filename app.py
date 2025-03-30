import os
import json
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import requests
from config import Config
from models import db, Product, Order, User
from datetime import datetime, timedelta
from telegram import Bot
import asyncio
from dotenv import load_dotenv
import nest_asyncio

# Применяем nest_asyncio для работы с вложенными циклами событий
nest_asyncio.apply()

# Загружаем переменные окружения
load_dotenv()

app = Flask(__name__, static_folder='frontend/static', template_folder='frontend')
app.config.from_object(Config)
CORS(app)
db.init_app(app)

# Инициализация Telegram-бота
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
bot = Bot(token=TOKEN)
loop = asyncio.get_event_loop()

# Создание таблиц и начального пользователя
with app.app_context():
    db.create_all()
    if not User.query.first():
        admin = User(username='admin', password_hash=generate_password_hash('admin123'))
        db.session.add(admin)
        db.session.commit()

# Проверка авторизации
def check_auth():
    auth = request.authorization
    if not auth or not auth.username or not auth.password:
        return False
    user = User.query.filter_by(username=auth.username).first()
    return user and check_password_hash(user.password_hash, auth.password)

# Синхронизация с Эвотор (закомментирована)
def sync_with_evotor(product_id, name, price, quantity):
    if not app.config['EVOTOR_API_TOKEN']:
        return
    headers = {'Authorization': f'Bearer {app.config["EVOTOR_API_TOKEN"]}'}
    data = {'name': name, 'price': price, 'quantity': quantity}
    try:
        response = requests.put(f'https://api.evotor.ru/v1/inventory/products/{product_id}', 
                               headers=headers, json=data)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Ошибка синхронизации с ЭВОТОР: {e}")

# Отправка заказа в Telegram-бот
def send_order_to_bot(order_text):
    try:
        loop.run_until_complete(bot.send_message(chat_id=CHAT_ID, text=order_text))
        print(f"Успешно отправлено боту: {order_text}")
    except Exception as e:
        print(f"Ошибка отправки в Telegram: {e}")

# Получение всех продуктов
@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.filter(Product.quantity > 0).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'price': p.price,
        'quantity': p.quantity,
        'photo': f'/static/uploads/{p.photo}' if p.photo else None,
        'category': p.category
    } for p in products])

# Получение продукта по ID
@app.route('/api/product/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    if product.quantity <= 0:
        return jsonify({'error': 'Товар недоступен'}), 404
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'quantity': product.quantity,
        'photo': f'/static/uploads/{product.photo}' if p.photo else None,
        'category': product.category
    })

# Добавление продукта
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

    product = Product(
        name=data['name'],
        description=data.get('description'),
        price=float(data['price']),
        quantity=int(data['quantity']),
        photo=photo_filename,
        category=data.get('category', 'Без категории')
    )
    db.session.add(product)
    db.session.commit()
    # sync_with_evotor(product.id, product.name, product.price, product.quantity)
    
    return jsonify({'message': 'Товар добавлен', 'id': product.id}), 201

# Обновление продукта
@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if not check_auth():
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    product = Product.query.get_or_404(product_id)
    data = request.form
    file = request.files.get('photo')

    product.name = data.get('name', product.name)
    product.description = data.get('description', product.description)
    product.price = float(data.get('price', product.price)) if data.get('price') else product.price
    product.quantity = int(data.get('quantity', product.quantity)) if data.get('quantity') else product.quantity
    product.category = data.get('category', product.category)
    
    if file:
        photo_filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))
        product.photo = photo_filename

    db.session.commit()
    # sync_with_evotor(product.id, product.name, product.price, product.quantity)
    
    return jsonify({'message': 'Товар обновлен'})

# Удаление продукта
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not check_auth():
        return jsonify({'error': 'Необходима авторизация'}), 401
    
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Товар удален'})

# Создание заказа
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    required_fields = ['customer_name', 'phone', 'items', 'delivery_method', 'desired_datetime']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Отсутствуют обязательные поля'}), 400

    delivery_method = data['delivery_method']
    if delivery_method not in ['pickup', 'delivery']:
        return jsonify({'error': 'Неверный способ получения: выберите "pickup" или "delivery"'}), 400
    
    if delivery_method == 'delivery' and 'address' not in data:
        return jsonify({'error': 'Укажите адрес для доставки'}), 400

    try:
        desired_dt = datetime.strptime(data['desired_datetime'], '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return jsonify({'error': 'Неверный формат даты и времени, используйте YYYY-MM-DD HH:MM:SS'}), 400

    now = datetime.now()
    min_delivery_time = now + timedelta(minutes=30)

    if delivery_method == 'delivery':
        if not data['address'].lower().startswith('г. михайловск'):
            return jsonify({'error': 'Доставка возможна только по г. Михайловску'}), 400
        if desired_dt < min_delivery_time:
            return jsonify({'error': f'Доставка возможна не раньше {min_delivery_time.strftime("%Y-%m-%d %H:%M:%S")}'}), 400
        if desired_dt.weekday() == 0:
            return jsonify({'error': 'Доставка не осуществляется в понедельник'}), 400
        desired_hour = desired_dt.hour
        desired_minute = desired_dt.minute
        if not (9 <= desired_hour < 15 or (desired_hour == 15 and desired_minute <= 30)):
            return jsonify({'error': 'Доставка возможна только с 9:00 до 15:30'}), 400

    items = data['items']
    order_text = (
        f"Новый заказ:\n"
        f"Имя: {data['customer_name']}\n"
        f"Телефон: {data['phone']}\n"
        f"Способ получения: {'Самовывоз' if delivery_method == 'pickup' else 'Доставка'}\n"
        f"Желаемое время: {desired_dt.strftime('%Y-%m-%d %H:%M:%S')}\n"
    )
    
    if delivery_method == 'delivery':
        order_text += f"Адрес: {data['address']}\n"
    
    order_text += "Товары:\n"
    for item in items:
        product = Product.query.get_or_404(item['id'])
        if product.quantity < item['qty']:
            return jsonify({'error': f'Недостаточно товара {product.name}'}), 400
        product.quantity -= item['qty']
        order_text += f"{product.name} - {item['qty']} шт. (цена: {product.price} руб.)\n"
        # sync_with_evotor(product.id, product.name, product.price, product.quantity)
    
    order = Order(
        customer_name=data['customer_name'],
        phone=data['phone'],
        items=json.dumps(items)
    )
    db.session.add(order)
    db.session.commit()

    send_order_to_bot(order_text)
    
    return jsonify({'message': 'Заказ успешно отправлен'}), 201

# Обслуживание загруженных файлов
@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Обслуживание React
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
    app.run(host='0.0.0.0', port=8080)