# app/tests/test_metrics.py
from fastapi.testclient import TestClient
from app.main import app
from app import db as db_mod

client = TestClient(app)

def test_seed_and_metrics_endpoints():
    db_mod.init_db()
    # seed one user via helper
    user_id = db_mod.gen_ulid()
    db = db_mod.SessionLocal()
    db.execute("INSERT OR IGNORE INTO users (id, name) VALUES (:id, :name)", {"id": user_id, "name": "pytest"})
    db.commit()
    db.close()

    # save one metric row directly
    metrics = {"phoneme_accuracy": 0.7, "pronunciation_score": 70.0, "fluency_score": 0.5, "duration": 2.3, "processing_time": 0.7}
    db_mod.save_metrics(user_id=user_id, transcript_id="t-pytest", metrics=metrics)

    # call the API
    res = client.get(f"/metrics/{user_id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    # trend
    res2 = client.get(f"/metrics/{user_id}/trend")
    assert res2.status_code == 200
