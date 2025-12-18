import pytest
import json
import time
from app.models import User, Request


class TestUserModel:
    def test_user_creation(self):
        """Тест создания пользователя"""
        user = User(
            email=f"test_{int(time.time())}@example.com",
            name="Тестовый Пользователь",
            role="student",
            institute="ИРИТ",
            group="22БАП1",
            student_id="1234567"
        )
        
        assert "test_" in user.email
        assert user.name == "Тестовый Пользователь"
        assert user.role == "student"
        assert user.institute == "ИРИТ"
        assert user.group == "22БАП1"
        assert user.student_id == "1234567"
    
    def test_password_hashing(self):
        """Тест хеширования пароля"""
        user = User(email="test_pass@example.com", name="Test")
        user.set_password("my_secret_password")
        
   
        assert user.password_hash != "my_secret_password"

        assert user.check_password("my_secret_password")

        assert not user.check_password("wrong_password")
    
    def test_default_role(self):
        """Тест дефолтной роли"""
  
        user = User(email="test_default@example.com", name="Test")
        
 
        user.role = "student"
        assert user.role == "student"
        
       
        
        user2 = User(email="test_admin@example.com", name="Admin", role="admin")
        assert user2.role == "admin"



class TestRequestModel:
    def test_request_creation(self):
        """Тест создания заявки"""
        request = Request(
            type="study_certificate",
            status="pending",
            form_data=json.dumps({"copies": 2, "reason": "Для банка"}),
            personal_data=json.dumps({"phone": "+79001234567"}),
            user_id=1
        )
        
        assert request.type == "study_certificate"
        assert request.status == "pending"
        
        form_data = json.loads(request.form_data)
        assert form_data["copies"] == 2
        assert form_data["reason"] == "Для банка"
    
    def test_default_status(self):
        """Тест дефолтного статуса"""
        
        request = Request(type="test_type", user_id=1)
        
        request.status = "pending"
        assert request.status == "pending"
        
        request2 = Request(type="test_type", user_id=1, status="approved")
        assert request2.status == "approved"
    
    def test_json_parsing_edge_cases(self):
        """Тест граничных случаев с JSON"""

        request = Request(type="test", user_id=1)
        assert request.form_data is None
        assert request.personal_data is None
        

        request2 = Request(
            type="test", 
            user_id=1,
            form_data=json.dumps({}),
            personal_data=json.dumps({})
        )
        assert json.loads(request2.form_data) == {}
        assert json.loads(request2.personal_data) == {}


class TestModelsWithDatabase:
    """Тесты, которые требуют базу данных"""
    
    def test_user_save_to_db(self, app):
        """Тест сохранения пользователя в БД"""
        with app.app_context():
            from app import db
            

            unique_email = f"dbtest_{int(time.time())}_{hash('test')}@example.com"
            user = User(
                email=unique_email,
                name="DB Test User",
                role="student"
            )
            user.set_password("db_password")
            
    
            db.session.add(user)
            db.session.commit()
            

            saved_user = User.query.filter_by(email=unique_email).first()
            assert saved_user is not None
            assert saved_user.name == "DB Test User"
            assert saved_user.check_password("db_password")
    
    def test_request_save_to_db(self, app):
        """Тест сохранения заявки в БД"""
        with app.app_context():
            from app import db

            user_email = f"user_for_req_{int(time.time())}@example.com"
            user = User(email=user_email, name="Request User")
            user.set_password("pass")
            db.session.add(user)
            db.session.commit()
            
            request = Request(
                type="academic_leave",
                form_data=json.dumps({"reason": "По здоровью", "period": "2024"}),
                user_id=user.id
            )
            
            db.session.add(request)
            db.session.commit()
            
            saved_request = Request.query.filter_by(user_id=user.id).first()
            assert saved_request is not None
            assert saved_request.type == "academic_leave"
            assert json.loads(saved_request.form_data)["reason"] == "По здоровью"
    
    def test_relationship_user_requests(self, app):
        """Тест связи пользователь-заявки"""
        with app.app_context():
            from app import db
            
            user_email = f"rel_test_{int(time.time())}@example.com"
            user = User(email=user_email, name="Relation Test")
            user.set_password("pass")
            db.session.add(user)
            db.session.commit()
            
            for i in range(3):
                request = Request(
                    type=f"type_{i}",
                    form_data=json.dumps({"index": i}),
                    user_id=user.id
                )
                db.session.add(request)
            db.session.commit()
            
            assert len(user.requests) == 3
            for i, req in enumerate(user.requests):
                assert req.type == f"type_{i}"
                assert req.user_id == user.id


class TestToDictMethods:
    """Тесты методов to_dict()"""
    
    def test_user_to_dict_with_db(self, app):
        """Тест to_dict() пользователя после сохранения в БД"""
        with app.app_context():
            from app import db
            
            user = User(
                email=f"todict_{int(time.time())}@example.com",
                name="ToDict Test",
                role="admin"
            )
            user.set_password("secret")
            
            db.session.add(user)
            db.session.commit()
            
            user_dict = user.to_dict()
            
            assert "id" in user_dict
            assert user_dict["email"] == user.email
            assert user_dict["name"] == "ToDict Test"
            assert user_dict["role"] == "admin"
            assert "created_at" in user_dict
            assert user_dict["created_at"] is not None
            assert "password_hash" not in user_dict 
    
    def test_request_to_dict_with_db(self, app):
        """Тест to_dict() заявки после сохранения в БД"""
        with app.app_context():
            from app import db
            
           
            user = User(
                email=f"req_todict_{int(time.time())}@example.com",
                name="Request ToDict User"
            )
            user.set_password("pass")
            db.session.add(user)
            db.session.commit()
            
            
            request = Request(
                type="status_certificate",
                form_data=json.dumps({"purpose": "Работа"}),
                personal_data=json.dumps({"address": "ул. Ленина, 1"}),
                user_id=user.id
            )
            db.session.add(request)
            db.session.commit()
            
           
            request_dict = request.to_dict()
            
            assert request_dict["type"] == "status_certificate"
            assert request_dict["status"] == "pending"
            assert request_dict["form_data"]["purpose"] == "Работа"
            assert request_dict["personal_data"]["address"] == "ул. Ленина, 1"
            assert request_dict["user_id"] == user.id
            assert "user_email" in request_dict
            assert request_dict["user_email"] == user.email
            assert "created_at" in request_dict
            assert request_dict["created_at"] is not None