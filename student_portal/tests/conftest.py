import pytest
import tempfile
import os
from app import create_app, db
from app.models import User


@pytest.fixture(scope='session')
def app():
    """Создает тестовое Flask-приложение (один раз для всех тестов)"""

    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.app_context():
        db.create_all()
        

        if not User.query.filter_by(email='test_student@nstu.ru').first():
            student = User(
                email='test_student@nstu.ru',
                name='Тестовый Студент',
                role='student',
                institute='ИРИТ',
                group='22БАП1',
                student_id='1234567'
            )
            student.set_password('password123')
            db.session.add(student)
        
        if not User.query.filter_by(email='test_admin@nstu.ru').first():
            admin = User(
                email='test_admin@nstu.ru',
                name='Тестовый Админ',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
        
        db.session.commit()
    
    yield app
    
 
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Тестовый клиент"""
    return app.test_client()


@pytest.fixture
def test_user(app):
    """Тестовый пользователь студент"""
    with app.app_context():
        return User.query.filter_by(email='test_student@nstu.ru').first()


@pytest.fixture
def test_admin(app):
    """Тестовый пользователь админ"""
    with app.app_context():
        return User.query.filter_by(email='test_admin@nstu.ru').first()