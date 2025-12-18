import pytest


class TestRequestsAPI:
    def test_create_request_missing_type(self, client):
        """Тест создания заявки без типа"""
        response = client.post('/api/requests/', json={
            "form_data": {"copies": 2},
            "user_id": 1
        })
        
        assert response.status_code == 400

    def test_get_requests(self, client):
        """Тест получения списка заявок"""
        response = client.get('/api/requests/')
        
        assert response.status_code == 200
        data = response.get_json()
        assert "requests" in data
        assert isinstance(data["requests"], list)
