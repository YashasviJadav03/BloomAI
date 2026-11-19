import type { CheckInResponse, SuggestedActivity } from "./types";

/**
 * The single routing rule after a check-in (plan section 4, "Flow dependencies"):
 * safe_mode comes from Member A's distress rule. When it is true we go straight to
 * the safe-mode screen and do NOT ask the LLM for a calm reply.
 */
export function nextStepAfterCheckin(result: Pick<CheckInResponse, "safe_mode">): "safe_mode" | "calm_reply" {
  return result.safe_mode ? "safe_mode" : "calm_reply";
}

/** Activities that open Member B's calm-down screen. */
export const CALM_DOWN_ACTIVITIES: ReadonlySet<SuggestedActivity> = new Set(["breathing", "movement", "stretching"]);
