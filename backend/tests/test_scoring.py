from backend.app.scoring.formula import (
    calculate_emotion_score,
    calculate_focus_score,
    compute_scores_and_label
)
from backend.app.schemas.checkin import AudioFeatures

def test_scoring_calm_and_focused():
    audio = AudioFeatures(avg_volume=0.3, peak_volume=0.5, words_per_minute=110.0, duration_seconds=5.0)
    emotion = calculate_emotion_score("calm", "I did a great job today, finished fast!", audio)
    assert emotion >= 85

    # Duration on track (100s vs 100s expected)
    focus = calculate_focus_score(emotion, duration_seconds=100, expected_seconds=100, audio=audio)
    assert focus >= 75

    f, e, label = compute_scores_and_label("calm", "I did a great job today", audio, 100, 100)
    assert label in ["flow", "focused"]

def test_scoring_agitated_and_delayed():
    audio = AudioFeatures(avg_volume=0.85, peak_volume=0.95, words_per_minute=180.0, duration_seconds=10.0)
    emotion = calculate_emotion_score("angry", "I hate this hard homework bad", audio)
    assert emotion < 30

    # Overdue task pacing (300s vs 100s expected)
    focus = calculate_focus_score(emotion, duration_seconds=300, expected_seconds=100, audio=audio)
    assert focus < 50

    f, e, label = compute_scores_and_label("angry", "I hate this hard homework bad", audio, 300, 100)
    assert label in ["frustrated", "tired"]
