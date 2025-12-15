from flask import render_template, send_from_directory
from app import create_app, db
from app.models import User

app = create_app()


# Создание базы данных и тестовых данных
def init_db():
    with app.app_context():
        db.create_all()

        # Создаем тестовых пользователей если их нет
        if not User.query.filter_by(email='student@nstu.ru').first():
            student = User(
                email='student@nstu.ru',
                name='Иван Иванов',
                role='student',
                institute='ИРИТ',
                group='22БАП1',
                student_id='1234567'
            )
            student.set_password('password123')
            db.session.add(student)

        if not User.query.filter_by(email='admin@nstu.ru').first():
            admin = User(
                email='admin@nstu.ru',
                name='Администратор Системы',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)

        db.session.commit()
        print("База данных инициализирована")


# Маршруты для фронтенда
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/index1.html')
def study_certificate():
    return render_template('index1.html')


@app.route('/index2.html')
def academic_leave():
    return render_template('index2.html')


@app.route('/index3.html')
def status_certificate():
    return render_template('index3.html')


# Обслуживание статических файлов
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)


@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/css', filename)


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)