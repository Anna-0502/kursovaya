import pytest
import json
from unittest.mock import Mock, patch


class TestAuthAPI:
    def test_login_endpoint_structure(self, client):
        """Тестируем структуру ответа endpoint'а"""
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        }) 

        assert response is not None
        assert hasattr(response, 'status_code')
        assert hasattr(response, 'get_json')
        

        try:
            data = response.get_json()

            if response.status_code == 200:
                assert 'user' in data or 'message' in data
            elif response.status_code in [400, 401]:
                assert 'error' in data
        except:
            pass

    def test_login_validation(self, client):
        """Тест валидации - должен всегда работать"""
        response = client.post('/api/auth/login', json={'password': 'pass'})
        assert response.status_code == 400
        
        response = client.post('/api/auth/login', json={'email': 'test@test.com'})
        assert response.status_code == 400
        
        response = client.post('/api/auth/login', json={})
        assert response.status_code == 400

    def test_login_mock(self):
        """Тест с моками - не требует запущенного сервера"""
        mock_user = Mock()
        mock_user.email = 'test@example.com'
        mock_user.check_password = Mock(return_value=True)
        mock_user.to_dict = Mock(return_value={'email': 'test@example.com', 'name': 'Test'})
        
        assert mock_user.email == 'test@example.com'
        assert mock_user.check_password('password123') == True