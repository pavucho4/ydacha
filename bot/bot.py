import os
from dotenv import load_dotenv
from telegram import Bot
from flask import Flask, request, Response
import asyncio

# Загружаем переменные из .env
load_dotenv()
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# Создаём Flask-приложение
flask_app = Flask(__name__)

# Создаём Telegram-бота
bot = Bot(token=TOKEN)

# Создаём цикл событий для асинхронных операций
loop = asyncio.get_event_loop()

# Маршрут для получения заказов от бэкенда
@flask_app.route('/send_order', methods=['POST'])
def send_order():
    data = request.json
    message = data.get('message')
    if message:
        try:
            # Запускаем асинхронную отправку сообщения в текущем цикле событий
            loop.run_until_complete(bot.send_message(chat_id=CHAT_ID, text=message))
            print(f"Сообщение отправлено: {message}")
        except Exception as e:
            print(f"Ошибка отправки в Telegram: {e}")
    return Response(status=200)

if __name__ == '__main__':
    print("Бот запускается...")
    flask_app.run(host='0.0.0.0', port=5001, debug=True)