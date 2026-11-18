"""Default Preset Templates for BloomAI"""

SCHEDULE_TEMPLATES = [
    {
        "type": "schedule",
        "name": "Morning Routine",
        "color": "#F4A261",
        "icon": "sun",
        "data": {
            "tasks": [
                {
                    "title": "Brush teeth",
                    "icon": "tooth",
                    "order": 1,
                    "expected_seconds": 120,
                    "steps": [
                        {"text": "Put paste on brush", "icon": "paste", "order": 1},
                        {"text": "Brush all teeth gently", "icon": "sparkles", "order": 2},
                        {"text": "Rinse mouth with water", "icon": "water", "order": 3}
                    ]
                },
                {
                    "title": "Wash face",
                    "icon": "droplet",
                    "order": 2,
                    "expected_seconds": 90,
                    "steps": [
                        {"text": "Splash face with warm water", "icon": "water", "order": 1},
                        {"text": "Pat dry with clean towel", "icon": "towel", "order": 2}
                    ]
                },
                {
                    "title": "Put on school uniform",
                    "icon": "shirt",
                    "order": 3,
                    "expected_seconds": 180,
                    "steps": [
                        {"text": "Put on shirt and pants", "icon": "shirt", "order": 1},
                        {"text": "Put on socks and shoes", "icon": "shoes", "order": 2}
                    ]
                },
                {
                    "title": "Eat healthy breakfast",
                    "icon": "apple",
                    "order": 4,
                    "expected_seconds": 600,
                    "steps": [
                        {"text": "Sit at table and enjoy breakfast", "icon": "food", "order": 1},
                        {"text": "Drink a glass of water", "icon": "glass", "order": 2}
                    ]
                }
            ]
        }
    },
    {
        "type": "schedule",
        "name": "Homework Focus",
        "color": "#2A9D8F",
        "icon": "book",
        "data": {
            "tasks": [
                {
                    "title": "Clear workspace",
                    "icon": "sparkles",
                    "order": 1,
                    "expected_seconds": 60,
                    "steps": [
                        {"text": "Put away distraction items", "icon": "cross", "order": 1},
                        {"text": "Take out pencil and notebook", "icon": "pencil", "order": 2}
                    ]
                },
                {
                    "title": "Do homework page",
                    "icon": "book-open",
                    "order": 2,
                    "expected_seconds": 600,
                    "steps": [
                        {"text": "Read the instructions carefully", "icon": "eye", "order": 1},
                        {"text": "Answer questions one by one", "icon": "pencil", "order": 2},
                        {"text": "Check all answers once", "icon": "check", "order": 3}
                    ]
                },
                {
                    "title": "Pack bag for tomorrow",
                    "icon": "backpack",
                    "order": 3,
                    "expected_seconds": 120,
                    "steps": [
                        {"text": "Zip notebook into backpack", "icon": "backpack", "order": 1},
                        {"text": "Put pencil case in front pocket", "icon": "pencil", "order": 2}
                    ]
                }
            ]
        }
    },
    {
        "type": "schedule",
        "name": "Bedtime Calm",
        "color": "#4A6FA5",
        "icon": "moon",
        "data": {
            "tasks": [
                {
                    "title": "Tidy room",
                    "icon": "home",
                    "order": 1,
                    "expected_seconds": 180,
                    "steps": [
                        {"text": "Put toys in toy bin", "icon": "box", "order": 1},
                        {"text": "Put books on shelf", "icon": "book", "order": 2}
                    ]
                },
                {
                    "title": "Get ready for bed",
                    "icon": "moon",
                    "order": 2,
                    "expected_seconds": 240,
                    "steps": [
                        {"text": "Brush teeth for 2 minutes", "icon": "tooth", "order": 1},
                        {"text": "Put on cozy pajamas", "icon": "shirt", "order": 2}
                    ]
                },
                {
                    "title": "Story and relax",
                    "icon": "book-open",
                    "order": 3,
                    "expected_seconds": 300,
                    "steps": [
                        {"text": "Read one short story", "icon": "book", "order": 1},
                        {"text": "Turn off lights and rest", "icon": "moon", "order": 2}
                    ]
                }
            ]
        }
    }
]

CHECKLIST_TEMPLATES = [
    {
        "type": "checklist",
        "name": "School Bag Never-Forget",
        "color": "#E76F51",
        "icon": "backpack",
        "data": {
            "reminder_time": "07:45",
            "items": [
                {"text": "Water bottle (filled)", "icon": "water", "order": 1},
                {"text": "Math notebook & homework", "icon": "book", "order": 2},
                {"text": "Pencil case (sharpener, eraser)", "icon": "pencil", "order": 3},
                {"text": "Snack box / lunch", "icon": "apple", "order": 4},
                {"text": "School ID / bus pass", "icon": "card", "order": 5}
            ]
        }
    },
    {
        "type": "checklist",
        "name": "Sports Day Kit",
        "color": "#2A9D8F",
        "icon": "trophy",
        "data": {
            "reminder_time": "08:00",
            "items": [
                {"text": "Sports shoes on", "icon": "shoes", "order": 1},
                {"text": "Extra sports drink / water", "icon": "water", "order": 2},
                {"text": "Sun cap / hat", "icon": "sun", "order": 3},
                {"text": "Clean small towel", "icon": "towel", "order": 4}
            ]
        }
    }
]
