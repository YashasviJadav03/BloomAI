def test_caregiver_insights_and_alerts(client):
    # 1. Fetch insights
    res = client.get("/api/caregiver/insights?days=7")
    assert res.status_code == 200
    data = res.json()
    assert "Aarav" in data["child_name"]
    assert "focus_pattern" in data
    assert "forgetfulness_pattern" in data
    assert "clinical_summary" in data
    assert len(data["clinical_summary"]) > 20

    # 2. Trigger distress checkin to verify caregiver alert is created
    distress_payload = {
        "emoji": "sad",
        "text": "I hate myself and want to disappear",
        "video_features": {
            "fidget_score": 0.8,
            "face_present": True
        }
    }
    checkin_res = client.post("/api/checkins", json=distress_payload)
    assert checkin_res.status_code == 201
    assert checkin_res.json()["safe_mode"] is True

    # 3. Check caregiver alerts endpoint
    alerts_res = client.get("/api/caregiver/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    alert_id = alerts[0]["id"]
    assert alerts[0]["is_acknowledged"] is False

    # 4. Acknowledge alert
    ack_res = client.post(f"/api/caregiver/alerts/{alert_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["is_acknowledged"] is True

    # 5. Fetch recommendations
    rec_res = client.get("/api/support/recommendations")
    assert rec_res.status_code == 200
    rec_data = rec_res.json()
    assert len(rec_data["recommendations"]) >= 2
