def test_ai_praise_and_calm_reply_endpoints(client):
    # 1. Praise endpoint
    praise_req = {
        "event": "step_completed",
        "child_name": "Aarav",
        "task_title": "Homework",
        "step_text": "Write the date",
        "streak": 3
    }
    praise_res = client.post("/api/praise", json=praise_req)
    assert praise_res.status_code == 200
    praise_data = praise_res.json()
    assert len(praise_data["message"]) > 0
    assert praise_data["source"] in ["template", "llm"]

    # 2. Calm reply endpoint
    calm_req = {
        "child_name": "Aarav",
        "emoji": "angry",
        "text": "I hate this homework",
        "focus_score": 42,
        "emotion_score": 35
    }
    calm_res = client.post("/api/calm-reply", json=calm_req)
    assert calm_res.status_code == 200
    calm_data = calm_res.json()
    assert len(calm_data["message"]) > 5
    assert calm_data["suggested_activity"] in ["breathing", "movement", "stretching", "none"]
