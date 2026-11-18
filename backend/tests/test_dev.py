def test_dev_seed_and_reset(client):
    # Test seed demo
    seed_res = client.post("/api/dev/seed-demo")
    assert seed_res.status_code == 200
    assert seed_res.json()["days_seeded"] == 14

    # Verify checkins exist
    chk_res = client.get("/api/checkins?days=14")
    assert chk_res.status_code == 200
    assert len(chk_res.json()) >= 10

    # Test reset
    reset_res = client.post("/api/dev/reset")
    assert reset_res.status_code == 200

    # Verify profile exists after reset
    prof_res = client.get("/api/profile")
    assert prof_res.status_code == 200
