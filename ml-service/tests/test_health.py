from app.main import health

def test_health_reports_service_status():
    response = health()
    assert response["status"] == "UP"
    assert "model_loaded" in response
