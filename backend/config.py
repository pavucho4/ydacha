import os
from dotenv import load_dotenv

load_dotenv()  # Загружаем переменные из .env

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')
    EVOTOR_API_TOKEN = os.getenv('EVOTOR_API_TOKEN')  # Токен для ЭВОТОР
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static/uploads')