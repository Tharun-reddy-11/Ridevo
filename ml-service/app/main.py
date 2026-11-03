"""RideNexa Machine Learning Recommendation Service.
Provides confidence-aware ranking and content-based recommendation models.
"""
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

APP_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = APP_ROOT / "artifacts" / "content_ranker.joblib"
app = FastAPI(title="RideNexa ML Service", version="1.0.0")

def load_saved_model() -> Pipeline | None:
    if MODEL_PATH.exists():
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            return None
    return None

model: Pipeline | None = load_saved_model()

class Candidate(BaseModel):
    vehicle_id: str
    category: str
    daily_rate: float = Field(gt=0)
    city: str
    delivery_supported: bool
    driver_supported: bool
    rating: float = Field(ge=0, le=5)
    review_count: int = Field(ge=0)

class TrainingExample(Candidate):
    interested: Literal[0, 1]

class TrainingRequest(BaseModel):
    examples: list[TrainingExample] = Field(min_length=12)

class RankingRequest(BaseModel):
    candidates: list[Candidate] = Field(min_length=1, max_length=200)

class UserRecommendationRequest(BaseModel):
    user_id: str
    city: str | None = None
    candidates: list[Candidate] = Field(min_length=1, max_length=200)

def compute_bayesian_score(rating: float, reviews: int, min_reviews: int = 3, prior_mean: float = 4.0) -> float:
    """Confidence-aware Bayesian weighted rating calculation."""
    return (reviews / (reviews + min_reviews)) * rating + (min_reviews / (reviews + min_reviews)) * prior_mean

@app.get("/health")
def health() -> dict:
    global model
    if model is None:
        model = load_saved_model()
    return {
        "service": "ridenexa-ml",
        "status": "UP",
        "model_loaded": model is not None,
        "mode": "ML_MODEL" if model is not None else "CONFIDENCE_WEIGHTED_HEURISTIC"
    }

@app.post("/recommendations/train")
def train(request: TrainingRequest) -> dict:
    global model
    frame = pd.DataFrame([row.model_dump() for row in request.examples])
    if frame["interested"].nunique() < 2:
        raise HTTPException(422, "Training requires both positive and negative interaction examples.")
    features = ["category", "daily_rate", "city", "delivery_supported", "driver_supported", "rating", "review_count"]
    categorical = ["category", "city", "delivery_supported", "driver_supported"]
    numeric = ["daily_rate", "rating", "review_count"]
    model = Pipeline([
        ("features", ColumnTransformer([
            ("category", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", StandardScaler(), numeric)
        ])),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced"))
    ])
    model.fit(frame[features], frame["interested"])
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    return {"status": "TRAINED", "examples": len(frame), "positive_examples": int(frame["interested"].sum())}

@app.post("/recommendations/rank")
def rank(request: RankingRequest) -> dict:
    global model
    if model is None:
        model = load_saved_model()

    frame = pd.DataFrame([row.model_dump() for row in request.candidates])
    
    if model is not None:
        features = ["category", "daily_rate", "city", "delivery_supported", "driver_supported", "rating", "review_count"]
        probabilities = model.predict_proba(frame[features])[:, 1]
        recommendations = [
            {"vehicle_id": v_id, "score": round(float(score), 6)}
            for v_id, score in zip(frame["vehicle_id"], probabilities)
        ]
    else:
        # High-precision Bayesian confidence-weighted ranking baseline
        scores = []
        for _, row in frame.iterrows():
            bayesian_rating = compute_bayesian_score(float(row["rating"]), int(row["review_count"]))
            price_norm = 1.0 / (1.0 + float(row["daily_rate"]) / 2500.0)
            delivery_bonus = 0.15 if row["delivery_supported"] else 0.0
            combined = 0.55 * (bayesian_rating / 5.0) + 0.30 * price_norm + delivery_bonus
            scores.append(round(float(combined), 6))
        
        recommendations = [
            {"vehicle_id": v_id, "score": score}
            for v_id, score in zip(frame["vehicle_id"], scores)
        ]

    recommendations.sort(key=lambda item: item["score"], reverse=True)
    return {
        "status": "OK",
        "model_loaded": model is not None,
        "recommendations": recommendations
    }

@app.post("/recommendations/user")
def user_recommendations(request: UserRecommendationRequest) -> dict:
    return rank(RankingRequest(candidates=request.candidates))
