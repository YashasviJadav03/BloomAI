import type { Emoji, SuggestedActivity } from "./types";

export interface EmojiOption {
  value: Emoji;
  glyph: string;
  label: string;
}

/** Order runs from pleasant to hard, so the first choices a child sees are gentle. */
export const EMOJI_OPTIONS: EmojiOption[] = [
  { value: "happy", glyph: "😊", label: "Happy" },
  { value: "calm", glyph: "😌", label: "Calm" },
  { value: "tired", glyph: "🥱", label: "Tired" },
  { value: "sad", glyph: "😢", label: "Sad" },
  { value: "worried", glyph: "😟", label: "Worried" },
  { value: "angry", glyph: "😠", label: "Angry" },
];

export const ACTIVITY_LABELS: Record<SuggestedActivity, string> = {
  breathing: "Breathe with me",
  movement: "Wiggle break",
  stretching: "Big stretch",
  talk_to_adult: "Find a grown-up",
  none: "Keep going",
};
