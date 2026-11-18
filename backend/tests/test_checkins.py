def test_checkin_submission_and_history(client):
    payload = {
        "emoji": "happy",
        "text": "Finished my tasks and had fun!",
        "audio_features": {
            "avg_volume": 0.35,
            "peak_volume": 0.55,
            "words_per_minute": 110.0,
            "duration_seconds": 6.0
        }
    }
    res = client.post("/api/checkins", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["focus_score"] > 60
    assert data["emotion_score"] > 70
    assert data["label"] in ["flow", "focused", "calm"]
    assert data["safe_mode"] is False

    # Check history
    hist_res = client.get("/api/checkins?days=7")
    assert hist_res.status_code == 200
    records = hist_res.json()
    assert len(records) >= 1
    assert records[0]["id"] == data["id"]
