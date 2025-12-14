from flask import Blueprint, request, jsonify
# Импортируем db и модели из основного пакета app
from app import db
from app.models import User
import json

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email и пароль обязательны'}), 400

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            return jsonify({
                'message': 'Вход выполнен успешно',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Неверный email или пароль'}), 401

    except Exception as e:
        return jsonify({'error': 'Ошибка сервера'}), 500

# ... остальные маршруты