def test_checklists_crud_and_reset(client):
    # 1. Fetch checklists
    list_res = client.get("/api/checklists")
    assert list_res.status_code == 200
    checklists = list_res.json()
    assert len(checklists) >= 1
    chk = checklists[0]
    chk_id = chk["id"]
    item_id = chk["items"][0]["id"]

    # 2. Toggle item checked
    toggle_res = client.put(f"/api/checklist-items/{item_id}", json={"is_checked": True})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_checked"] is True

    # 3. Reset checklist
    reset_res = client.post(f"/api/checklists/{chk_id}/reset")
    assert reset_res.status_code == 200
    items = reset_res.json()["items"]
    assert all(it["is_checked"] is False for it in items)

    # 4. Add new item
    add_item_res = client.post(
        f"/api/checklists/{chk_id}/items",
        json={"text": "Extra Pencil", "icon": "pencil", "order": 10}
    )
    assert add_item_res.status_code == 201
    new_item_id = add_item_res.json()["id"]

    # 5. Delete item
    del_item_res = client.delete(f"/api/checklist-items/{new_item_id}")
    assert del_item_res.status_code == 200
