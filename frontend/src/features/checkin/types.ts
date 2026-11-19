// Shapes from docs/api-contract.md (sections 7 and 8). snake_case matches the API.

export type Emoji = "happy" | "calm" | "tired" | "sad" | "worried" | "angry";

export type SuggestedActivity = "breathing" | "movement" | "stretching" | "talk_to_adult" | "none";

export type PraiseEvent = "step_completed" | "task_completed" | "session_ended" | "streak";

/** The only voice data that ever leaves the device: four numbers, no audio. */
export interface AudioFeatures {
  avg_volume: number;
  peak_volume: number;
  words_per_minute: number | null;
  duration_seconds: number;
}

export interface CheckInRequest {
  session_id?: number | null;
  emoji: Emoji;
  text?: string | null;
  audio_features?: AudioFeatures | null;
}

export interface CheckInResponse {
  id: number;
  focus_score: number;
  emotion_score: number;
  label: string;
  safe_mode: boolean;
  created_at?: string | null;
}

export interface CalmReplyRequest {
  child_name?: string | null;
  emoji: Emoji;
  text?: string | null;
  focus_score?: number | null;
  emotion_score?: number | null;
}

export interface CalmReplyResponse {
  message: string;
  suggested_activity: SuggestedActivity;
  source: "llm" | "template";
}

export interface PraiseRequest {
  event: PraiseEvent;
  child_name?: string | null;
  task_title?: string | null;
  step_text?: string | null;
  streak?: number | null;
}

export interface PraiseResponse {
  message: string;
  source: "llm" | "template";
}
