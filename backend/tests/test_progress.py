def test_progress_endpoints(client):
    # Submit 2 checkins
    client.post("/api/checkins", json={"emoji": "happy", "text": "Great day"})
    client.post("/api/checkins", json={"emoji": "calm", "text": "Done"})

    # Summary
    sum_res = client.get("/api/progress/summary")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert "total_points" in sum_data
    assert "current_streak" in sum_data

    # Mood by day
    mood_res = client.get("/api/progress/mood?days=7")
    assert mood_res.status_code == 200
    mood_data = mood_res.json()
    assert len(mood_data) >= 1
    assert "avg_emotion_score" in mood_data[0]
    assert "avg_focus_score" in mood_data[0]
    assert mood_data[0]["checkins"] >= 2
