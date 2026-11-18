def test_task_session_flow_and_points(client):
    # Fetch a schedule task and step
    sched_res = client.get("/api/schedules")
    task = sched_res.json()[0]["tasks"][0]
    task_id = task["id"]
    step_id = task["steps"][0]["id"]

    # 1. Start session
    start_res = client.post("/api/sessions", json={"task_id": task_id})
    assert start_res.status_code == 201
    session_data = start_res.json()
    session_id = session_data["session_id"]
    assert session_data["expected_seconds"] == task["expected_seconds"]

    # 2. Complete a step
    comp_res = client.post(f"/api/sessions/{session_id}/steps/{step_id}/complete")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["points_awarded"] == 5
    assert comp_data["total_points"] >= 5
    assert comp_data["streak"] >= 1

    # 3. End session
    end_res = client.post(f"/api/sessions/{session_id}/end")
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert end_data["bonus_points"] == 10
    assert end_data["total_points"] >= 15
    assert "duration_seconds" in end_data

    # 4. Verify progress summary
    prog_res = client.get("/api/progress/summary")
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert prog_data["total_points"] >= 15
    assert prog_data["tasks_completed_today"] >= 1
