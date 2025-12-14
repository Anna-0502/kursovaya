from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Создаем экземпляр SQLAlchemy ДО создания приложения
db = SQLAlchemy()


def create_app():
    app = Flask(__name__,
                template_folder='../templates',
                static_folder='../static')

    # Базовая конфигурация
    app.config['SECRET_KEY'] = 'dev-secret-key-2024'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///student_portal.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Инициализируем db с приложением
    db.init_app(app)

    # Импортируем модели ПОСЛЕ создания db
    from app import models

    # Регистрируем маршруты
    from app.routes.auth import auth_bp
    from app.routes.requests import requests_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(requests_bp, url_prefix='/api/requests')

    return app