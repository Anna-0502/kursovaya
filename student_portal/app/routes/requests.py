from flask import Blueprint, request, jsonify
from app import db
from app.models import Request, User
import json

requests_bp = Blueprint('requests', __name__)


@requests_bp.route('/', methods=['POST'])
def create_request():
    try:
        data = request.get_json()

        if not data.get('type'):
            return jsonify({'error': 'Тип заявки обязателен'}), 400

        # В реальном приложении здесь должна быть аутентификация
        user_id = data.get('user_id', 1)  # Временное решение

        new_request = Request(
            type=data['type'],
            form_data=json.dumps(data.get('form_data', {})),
            personal_data=json.dumps(data.get('personal_data', {})),
            user_id=user_id
        )

        db.session.add(new_request)
        db.session.commit()

        return jsonify({
            'message': 'Заявка успешно создана',
            'request': new_request.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при создании заявки'}), 500


@requests_bp.route('/', methods=['GET'])
def get_all_requests():
    try:
        requests = Request.query.order_by(Request.created_at.desc()).all()

        return jsonify({
            'requests': [req.to_dict() for req in requests]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Ошибка при получении заявок'}), 500


@requests_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_requests(user_id):
    try:
        requests = Request.query.filter_by(user_id=user_id).order_by(Request.created_at.desc()).all()

        return jsonify({
            'requests': [req.to_dict() for req in requests]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Ошибка при получении заявок'}), 500


@requests_bp.route('/<int:request_id>/status', methods=['PUT'])
def update_request_status(request_id):
    try:
        data = request.get_json()
        new_status = data.get('status')

        if new_status not in ['pending', 'approved', 'rejected', 'completed']:
            return jsonify({'error': 'Неверный статус'}), 400

        request_obj = Request.query.get_or_404(request_id)
        request_obj.status = new_status

        db.session.commit()

        return jsonify({
            'message': 'Статус заявки обновлен',
            'request': request_obj.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка при обновлении статуса'}), 500


@requests_bp.route('/stats/user/<int:user_id>', methods=['GET'])
def get_user_stats(user_id):
    try:
        total = Request.query.filter_by(user_id=user_id).count()
        pending = Request.query.filter_by(user_id=user_id, status='pending').count()
        completed = Request.query.filter_by(user_id=user_id, status='completed').count()

        return jsonify({
            'stats': {
                'total': total,
                'pending': pending,
                'completed': completed
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Ошибка при получении статистики'}), 500