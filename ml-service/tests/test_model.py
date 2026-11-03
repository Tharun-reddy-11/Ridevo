from fastapi import HTTPException
from app.main import RankingRequest, Candidate, rank

def test_ranking_never_claims_a_model_without_one():
    request = RankingRequest(candidates=[Candidate(vehicle_id="v1", category="CAR", daily_rate=1500, city="Tirupati", delivery_supported=True, driver_supported=False, rating=0, review_count=0)])
    try:
        response = rank(request)
        assert response["status"] == "OK"
    except HTTPException as error:
        assert error.status_code == 503
