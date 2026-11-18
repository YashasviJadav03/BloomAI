from typing import Optional, Tuple
from backend.app.schemas.checkin import AudioFeatures
from backend.app.scoring.sentiment_lexicon import POSITIVE_WORDS, NEGATIVE_WORDS

EMOJI_BASE_SCORES = {
    "calm": 90,
    "happy": 85,
    "tired": 50,
    "worried": 40,
    "sad": 30,
    "angry": 20
}

def clamp(val: float, low: float = 0.0, high: float = 100.0) -> int:
    return int(max(low, min(high, round(val))))

def calculate_emotion_score(
    emoji: str,
    text: Optional[str] = None,
    audio: Optional[AudioFeatures] = None
) -> int:
    base = EMOJI_BASE_SCORES.get(emoji.lower() if emoji else "calm", 60)
    
    # Text sentiment analysis
    delta_text = 0
    if text:
        tokens = [w.strip(".,!?;:\"'()").lower() for w in text.split()]
        pos_count = sum(1 for w in tokens if w in POSITIVE_WORDS)
        neg_count = sum(1 for w in tokens if w in NEGATIVE_WORDS)
        
        delta_text += min(pos_count * 5, 15)
        delta_text -= min(neg_count * 7, 21)
    
    # Audio features adjustment
    delta_audio = 0
    if audio:
        avg_vol = audio.avg_volume or 0.0
        peak_vol = audio.peak_volume or 0.0
        wpm = audio.words_per_minute or 0.0

        if avg_vol > 0.7 or peak_vol > 0.85:
            delta_audio -= 10
        if wpm > 160:
            delta_audio -= 10
        elif 0.2 <= avg_vol <= 0.5 and 90 <= wpm <= 130:
            delta_audio += 5

    return clamp(base + delta_text + delta_audio)


def calculate_focus_score(
    emotion_score: int,
    duration_seconds: Optional[int] = None,
    expected_seconds: Optional[int] = None,
    audio: Optional[AudioFeatures] = None
) -> int:
    base_focus = 75.0
    
    # Pacing Multiplier
    multiplier = 1.0
    if duration_seconds and expected_seconds and expected_seconds > 0:
        ratio = duration_seconds / expected_seconds
        if 0.7 <= ratio <= 1.25:
            multiplier = 1.15
        elif 1.25 < ratio <= 2.0:
            multiplier = 0.85
        elif ratio > 2.0:
            multiplier = 0.65

    focus = base_focus * multiplier

    # Emotion cross-influence
    if emotion_score >= 70:
        focus += 10
    elif emotion_score < 40:
        focus -= 15

    # Audio stability
    if audio and (audio.peak_volume or 0.0) > 0.9:
        focus -= 10

    return clamp(focus)


def determine_label(emotion_score: int, focus_score: int, emoji: str, safe_mode: bool = False) -> str:
    if safe_mode:
        return "distressed"
    if emotion_score >= 70 and focus_score >= 70:
        return "flow"
    if focus_score >= 65:
        return "focused"
    if emotion_score >= 60 and focus_score < 65:
        return "calm"
    if emoji == "tired" or focus_score < 40:
        return "tired"
    if emotion_score < 40:
        return "frustrated"
    return "calm"


def compute_scores_and_label(
    emoji: str,
    text: Optional[str] = None,
    audio: Optional[AudioFeatures] = None,
    duration_seconds: Optional[int] = None,
    expected_seconds: Optional[int] = None,
    safe_mode: bool = False
) -> Tuple[int, int, str]:
    emotion = calculate_emotion_score(emoji, text, audio)
    focus = calculate_focus_score(emotion, duration_seconds, expected_seconds, audio)
    label = determine_label(emotion, focus, emoji, safe_mode)
    return focus, emotion, label
