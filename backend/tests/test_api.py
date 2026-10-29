import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_db, SessionLocal

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_add_and_aggregate_meal_entries():
    test_date = "2026-10-12"

    # Add 1st entry: Grapes (260g) - 180 cal, 0 protein
    res1 = client.post(
        f"/api/logs/{test_date}/entries",
        json={"name": "Grapes (260g)", "calories": 180.0, "protein": 0.0},
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["date"] == test_date
    assert data1["total_calories"] >= 180.0

    # Add 2nd entry: IP congee - 597.975 cal, 72.159 protein (with 3 decimal precision)
    res2 = client.post(
        f"/api/logs/{test_date}/entries",
        json={"name": "IP congee", "calories": 597.975, "protein": 72.159},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total_calories"] >= 777.975
    assert data2["total_protein"] >= 72.159


def test_template_creation_and_retrieval():
    template_name = "40g Oats w 120g soy milk, 170g yogurt"
    res = client.post(
        "/api/templates",
        json={
            "name": template_name,
            "default_calories": 315.0,
            "default_protein": 32.0,
            "category": "Breakfast",
        },
    )
    assert res.status_code == 200
    t_data = res.json()
    assert t_data["name"] == template_name
    assert t_data["default_calories"] == 315.0
    assert t_data["default_protein"] == 32.0

    # Fetch templates list
    list_res = client.get("/api/templates")
    assert list_res.status_code == 200
    templates = list_res.json()
    assert any(t["name"] == template_name for t in templates)


def test_timeseries_analytics():
    res = client.get("/api/analytics/timeseries")
    assert res.status_code == 200
    data = res.json()
    assert "points" in data
    assert isinstance(data["points"], list)
    if data["points"]:
        first = data["points"][0]
        assert "date" in first
        assert "total_calories" in first
        assert "total_protein" in first
