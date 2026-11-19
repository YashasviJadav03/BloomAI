// Types mirror the REAL backend (backend/app/schemas/*.py) and docs/api-contract.md (snake_case).
// Where the backend and the older frontend assumptions differed, the backend wins.

export type Emoji = 'happy' | 'calm' | 'tired' | 'sad' | 'worried' | 'angry'

export interface Profile {
  id: number
  name: string
  avatar: string                      // free string. Seed uses "star"; the app offers animal keys (see theme/icons AVATARS)
  favourite_rewards: string[]         // free text ("Lego build break") OR our reward keys ("rocket"); both are handled
  created_at?: string
  updated_at?: string
}
export type ProfileInput = Pick<Profile, 'name' | 'avatar' | 'favourite_rewards'>

export interface Step { id: number; text: string; icon: string; order: number }
export interface Task {
  id: number
  title: string
  icon: string
  order: number
  expected_seconds: number
  steps: Step[]
}
export interface Schedule {
  id: number
  name: string
  color: string                       // hex
  icon: string
  created_at?: string
  tasks: Task[]
}
export type ScheduleInput = { name: string; color: string; icon: string; template_id?: number }
export type TaskInput = { title: string; icon: string; expected_seconds: number; order?: number }
export type StepInput = { text: string; icon: string; order?: number }

export interface ChecklistItem {
  id: number
  checklist_id?: number
  text: string
  icon: string
  is_checked: boolean
  order: number
}
export interface Checklist {
  id: number
  name: string
  reminder_time: string               // "HH:MM" (backend defaults to "08:00")
  created_at?: string
  items: ChecklistItem[]
}
export type ChecklistInput = { name?: string; reminder_time?: string; template_id?: number }

export interface Template {
  id: number
  type: 'schedule' | 'checklist'
  name: string
  color: string
  icon: string
  data: {
    tasks?: { title: string; icon: string; order?: number; expected_seconds?: number; steps?: { text: string; icon: string; order?: number }[] }[]
    reminder_time?: string
    items?: { text: string; icon: string; order?: number }[]
  }
}

export interface SessionStart { session_id: number; task_id: number; started_at: string; expected_seconds: number }
export interface StepComplete { points_awarded: number; total_points: number; streak: number; steps_remaining: number }
export interface SessionEnd { duration_seconds: number; expected_seconds: number; bonus_points: number; total_points: number }

export type PraiseEvent = 'step_completed' | 'task_completed'
export interface PraiseRequest {
  event: PraiseEvent
  child_name: string
  task_title: string
  step_text?: string
  streak: number
}
export interface PraiseResponse { message: string; source: string }

export interface CheckInRequest {
  session_id?: number | null
  emoji: Emoji
  text?: string | null
}
export interface CheckInResponse {
  id: number
  focus_score: number                 // 0-100, prototype heuristic (self-report based)
  emotion_score: number               // 0-100, higher = more positive
  label: string
  safe_mode: boolean
  created_at?: string
}
export interface CalmReplyRequest {
  child_name: string
  emoji: Emoji
  text?: string
  focus_score: number
  emotion_score: number
}
export interface CalmReplyResponse {
  message: string
  suggested_activity: string          // "breathing" | "movement" | "stretching" | "none" (free string)
  source: string
}

export interface SafetyResources {
  message: string
  resources: { name: string; contact: string }[]
}

export interface ProgressSummary {
  total_points: number
  current_streak: number
  best_streak: number
  tasks_completed_today: number
  tasks_completed_week: number
}
/** GET /api/progress/mood?days=N : only days that HAVE check-ins are returned. */
export interface MoodDay {
  date: string                        // YYYY-MM-DD
  avg_emotion_score: number
  avg_focus_score: number
  checkins: number
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
