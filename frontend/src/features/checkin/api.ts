import { mockResponse, request, USE_MOCK } from "./http";
import type {
  CalmReplyRequest, CalmReplyResponse, CheckInRequest, CheckInResponse,
  Emoji, PraiseRequest, PraiseResponse,
} from "./types";

/** Shown when the backend cannot be reached. Mirrors docs/ai-rules.md. */
const OFFLINE_CALM: Record<Emoji, Omit<CalmReplyResponse, "source">> = {
  angry: { message: "That sounds frustrating. Let's take three slow breaths together.", suggested_activity: "breathing" },
  worried: { message: "Worry can feel heavy. Let's shake out your hands and take a breath.", suggested_activity: "movement" },
  tired: { message: "Your brain worked hard. Let's stretch your arms up high.", suggested_activity: "stretching" },
  sad: { message: "It's okay to feel sad. You are doing your best.", suggested_activity: "breathing" },
  calm: { message: "You are in a calm space. Keep this gentle rhythm going.", suggested_activity: "none" },
  happy: { message: "Love seeing you happy! Let's keep that good energy going.", suggested_activity: "none" },
};

export const DEFAULT_PRAISE = "Nice effort! Keep it up.";

/** POST /api/checkins. Errors propagate: the caller must not guess safe_mode. */
export function submitCheckin(body: CheckInRequest): Promise<CheckInResponse> {
  if (USE_MOCK) {
    const distressed = /hate myself|want to disappear|hurt myself|i am stupid/i.test(body.text ?? "");
    return mockResponse({
      id: Date.now(),
      focus_score: distressed ? 30 : 42,
      emotion_score: distressed ? 10 : 35,
      label: distressed ? "distressed" : "frustrated",
      safe_mode: distressed,
    });
  }
  return request<CheckInResponse>("POST", "/api/checkins", {
    session_id: body.session_id ?? null,
    emoji: body.emoji,
    text: body.text?.trim() || null,
    audio_features: body.audio_features ?? null,
  });
}

/** POST /api/calm-reply. Never throws: falls back to a built-in reply. */
export async function fetchCalmReply(body: CalmReplyRequest): Promise<CalmReplyResponse> {
  if (USE_MOCK) return mockResponse({ ...OFFLINE_CALM[body.emoji], source: "template" });
  try {
    return await request<CalmReplyResponse>("POST", "/api/calm-reply", body, { timeoutMs: 7000 });
  } catch {
    return { ...OFFLINE_CALM[body.emoji] ?? OFFLINE_CALM.calm, source: "template" };
  }
}

/**
 * POST /api/praise, for Member B's reward animation (call after a step completes).
 * Never throws: falls back to DEFAULT_PRAISE.
 */
export async function fetchPraise(body: PraiseRequest): Promise<PraiseResponse> {
  if (USE_MOCK) {
    return mockResponse({ message: `You kept going on that step${body.child_name ? `, ${body.child_name}` : ""}. Nice effort!`, source: "template" });
  }
  try {
    return await request<PraiseResponse>("POST", "/api/praise", body, { timeoutMs: 6000 });
  } catch {
    return { message: DEFAULT_PRAISE, source: "template" };
  }
}

/** GET /api/checkins?days=N */
export function fetchRecentCheckins(days = 7): Promise<CheckInResponse[]> {
  if (USE_MOCK) return mockResponse([]);
  return request<CheckInResponse[]>("GET", `/api/checkins?days=${days}`);
}
