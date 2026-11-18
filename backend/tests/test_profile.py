def test_get_and_update_profile(client):
    # Test seeded profile
    res = client.get("/api/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Aarav"
    assert data["avatar"] == "star"
    assert isinstance(data["favourite_rewards"], list)

    # Test update profile
    update_payload = {
        "name": "Leo",
        "avatar": "rocket",
        "favourite_rewards": ["Extra iPad time", "Drawing time"]
    }
    update_res = client.put("/api/profile", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Leo"
    assert updated_data["avatar"] == "rocket"
    assert "Drawing time" in updated_data["favourite_rewards"]
