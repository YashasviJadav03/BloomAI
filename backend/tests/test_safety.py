from backend.app.safety.distress_detector import evaluate_distress

def test_distress_detection_rules():
    # Explicit keywords trip safe_mode regardless of emotion score
    assert evaluate_distress("I hate myself and I can't do anything right", emotion_score=60) is True
    assert evaluate_distress("I want to disappear", emotion_score=70) is True
    assert evaluate_distress("I am stupid and dumb", emotion_score=50) is True

    # Benign frustration does not trip safe_mode if score is moderate
    assert evaluate_distress("Math is a bit hard today", emotion_score=60) is False

    # Low score + severe frustration terms trips safe_mode
    assert evaluate_distress("I give up, hate this", emotion_score=20) is True

def test_safety_resources_endpoint(client):
    res = client.get("/api/safety/resources")
    assert res.status_code == 200
    data = res.json()
    assert "trusted adult" in data["message"].lower()
    assert len(data["resources"]) >= 2
    assert "name" in data["resources"][0]
    assert "contact" in data["resources"][0]

def test_checkin_triggers_safe_mode(client):
    payload = {
        "emoji": "sad",
        "text": "I hate myself so much",
        "audio_features": None
    }
    res = client.post("/api/checkins", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["safe_mode"] is True
    assert data["label"] == "distressed"
