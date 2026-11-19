// Types mirror docs/api-contract.md (snake_case, as sent over the wire).
// Items marked ASSUMED are not spelled out in the contract's "Key payloads":
// confirm the exact shape with Member A (see docs/frontend-api-assumptions.md).

export type Emoji = 'happy' | 'calm' | 'tired' | 'sad' | 'worried' | 'angry'

export interface Profile {            // ASSUMED shape
  id: number
  name: string
  avatar: string                      // key into theme/icons AVATARS
  favourite_rewards: string[]         // keys into theme/icons REWARDS
}
export type ProfileInput = Omit<Profile, 'id'>

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
  tasks: Task[]
}
// GET /api/schedules (list) — ASSUMED to return full nested schedules, same as GET /api/schedules/{id}.
export type ScheduleInput = { name: string; color: string; icon: string; template_id?: number }
export type TaskInput = { title: string; icon: string; expected_seconds: number }
export type StepInput = { text: string; icon: string }

export interface ChecklistItem { id: number; text: string; icon: string; checked: boolean }   // ASSUMED
export interface Checklist {                                                                     // ASSUMED
  id: number
  name: string
  icon: string
  reminder_time: string | null        // "HH:MM" 24h
  items: ChecklistItem[]
}
export type ChecklistInput = { name: string; icon?: string; reminder_time?: string | null; template_id?: number }

export interface Template {                                                                      // ASSUMED
  id: number
  type: 'schedule' | 'checklist'
  name: string
  color?: string
  icon: string
  description?: string
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
export interface PraiseResponse { message: string; source: 'llm' | 'template' }

export interface SafetyResources {
  message: string
  resources: { name: string; contact: string }[]
}

export interface ProgressSummary {                                                               // used for the points display
  total_points: number
  current_streak: number
  best_streak: number
  tasks_completed_today: number
  tasks_completed_week: number
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
