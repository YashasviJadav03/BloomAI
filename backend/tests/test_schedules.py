def test_schedules_crud_and_templates(client):
    # 1. Fetch templates
    tpl_res = client.get("/api/templates?type=schedule")
    assert tpl_res.status_code == 200
    templates = tpl_res.json()
    assert len(templates) >= 1
    tpl_id = templates[0]["id"]

    # 2. Create schedule from template
    create_res = client.post("/api/schedules", json={"template_id": tpl_id, "name": "My Custom Morning"})
    assert create_res.status_code == 201
    created_sched = create_res.json()
    assert created_sched["name"] == "My Custom Morning"
    assert len(created_sched["tasks"]) > 0
    sched_id = created_sched["id"]

    # 3. Get schedule with nested tasks
    get_res = client.get(f"/api/schedules/{sched_id}")
    assert get_res.status_code == 200
    sched_data = get_res.json()
    first_task = sched_data["tasks"][0]
    assert len(first_task["steps"]) > 0

    # 4. Add task to schedule
    new_task_res = client.post(
        f"/api/schedules/{sched_id}/tasks",
        json={"title": "High Five", "icon": "hand", "order": 99, "expected_seconds": 30}
    )
    assert new_task_res.status_code == 201
    task_id = new_task_res.json()["id"]

    # 5. Add step to task
    step_res = client.post(
        f"/api/tasks/{task_id}/steps",
        json={"text": "Raise hand and slap five", "icon": "sparkles", "order": 1}
    )
    assert step_res.status_code == 201
    step_id = step_res.json()["id"]

    # 6. Update step
    edit_step = client.put(f"/api/steps/{step_id}", json={"text": "Celebrate!"})
    assert edit_step.status_code == 200
    assert edit_step.json()["text"] == "Celebrate!"

    # 7. Delete step & task
    del_step = client.delete(f"/api/steps/{step_id}")
    assert del_step.status_code == 200
    del_task = client.delete(f"/api/tasks/{task_id}")
    assert del_task.status_code == 200

    # 8. Delete schedule
    del_sched = client.delete(f"/api/schedules/{sched_id}")
    assert del_sched.status_code == 200
