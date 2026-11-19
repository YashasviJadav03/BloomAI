// The ONLY place the UI talks to the backend.
// VITE_API_MODE=mock -> in-browser fake (api/mock.ts)   VITE_API_MODE=real -> fetch(`${VITE_API_BASE}/...`)
import { mockRequest } from './mock'
import type {
  CalmReplyRequest, CalmReplyResponse, CaregiverAlert, CaregiverInsights, CheckInRequest, CheckInResponse,
  Checklist, ChecklistInput, ChecklistItem, MoodDay, PraiseRequest, PraiseResponse, Profile, ProfileInput,
  ProgressSummary, SafetyResources, Schedule, ScheduleInput, SessionEnd, SessionStart, Step, StepComplete,
  StepInput, SupportRecommendations, Task, TaskInput, Template,
} from './types'
import { ApiError } from './types'

const MODE = (import.meta.env.VITE_API_MODE ?? 'mock') as 'mock' | 'real'
const BASE = (import.meta.env.VITE_API_BASE ?? '/api') as string
export const isMockMode = MODE === 'mock'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (MODE === 'mock') return (await mockRequest(method, path, body as Record<string, unknown>)) as T
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, "Can't reach the server")
  }
  if (!res.ok) {
    let detail = res.statusText
    try { detail = (await res.json()).detail ?? detail } catch { /* not json */ }
    throw new ApiError(res.status, typeof detail === 'string' ? detail : 'Something went wrong')
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
const get = <T,>(p: string) => request<T>('GET', p)
const post = <T,>(p: string, b?: unknown) => request<T>('POST', p, b ?? {})
const put = <T,>(p: string, b: unknown) => request<T>('PUT', p, b)
const del = (p: string) => request<unknown>('DELETE', p)

export const api = {
  // Profile
  getProfile: () => get<Profile>('/profile'),
  createProfile: (p: ProfileInput) => post<Profile>('/profile', p),
  updateProfile: (p: Partial<ProfileInput>) => put<Profile>('/profile', p),

  templates: (type: 'schedule' | 'checklist') => get<Template[]>(`/templates?type=${type}`),

  // Schedules > tasks > steps
  listSchedules: () => get<Schedule[]>('/schedules'),
  getSchedule: (id: number) => get<Schedule>(`/schedules/${id}`),
  createSchedule: (s: Partial<ScheduleInput>) => post<Schedule>('/schedules', s),
  updateSchedule: (id: number, s: Partial<ScheduleInput>) => put<Schedule>(`/schedules/${id}`, s),
  deleteSchedule: (id: number) => del(`/schedules/${id}`),

  addTask: (scheduleId: number, t: Partial<TaskInput>) => post<Task>(`/schedules/${scheduleId}/tasks`, t),
  updateTask: (id: number, t: Partial<TaskInput>) => put<Task>(`/tasks/${id}`, t),
  deleteTask: (id: number) => del(`/tasks/${id}`),
  reorderTasks: (scheduleId: number, taskIds: number[]) => put<Schedule>(`/schedules/${scheduleId}/tasks/reorder`, { ordered_task_ids: taskIds }),

  addStep: (taskId: number, s: Partial<StepInput>) => post<Step>(`/tasks/${taskId}/steps`, s),
  updateStep: (id: number, s: Partial<StepInput> & { order?: number }) => put<Step>(`/steps/${id}`, s),
  deleteStep: (id: number) => del(`/steps/${id}`),

  // Checklists
  listChecklists: () => get<Checklist[]>('/checklists'),
  createChecklist: (c: ChecklistInput) => post<Checklist>('/checklists', c),
  updateChecklist: (id: number, c: Partial<ChecklistInput>) => put<Checklist>(`/checklists/${id}`, c),
  deleteChecklist: (id: number) => del(`/checklists/${id}`),
  addChecklistItem: (id: number, i: { text: string; icon?: string; order?: number }) => post<ChecklistItem>(`/checklists/${id}/items`, i),
  updateChecklistItem: (id: number, i: Partial<Pick<ChecklistItem, 'text' | 'icon' | 'is_checked'>>) => put<ChecklistItem>(`/checklist-items/${id}`, i),
  deleteChecklistItem: (id: number) => del(`/checklist-items/${id}`),
  resetChecklist: (id: number) => post<Checklist>(`/checklists/${id}/reset`),

  // Sessions
  startSession: (taskId: number) => post<SessionStart>('/sessions', { task_id: taskId }),
  completeStep: (sessionId: number, stepId: number) => post<StepComplete>(`/sessions/${sessionId}/steps/${stepId}/complete`),
  endSession: (sessionId: number) => post<SessionEnd>(`/sessions/${sessionId}/end`),

  // AI + safety + progress (owned by C / A, read by B)
  praise: (r: PraiseRequest) => post<PraiseResponse>('/praise', r),
  submitCheckin: (c: CheckInRequest) => post<CheckInResponse>('/checkins', c),
  calmReply: (r: CalmReplyRequest) => post<CalmReplyResponse>('/calm-reply', r),
  safetyResources: () => get<SafetyResources>('/safety/resources'),
  progressSummary: () => get<ProgressSummary>('/progress/summary'),
  progressMood: (days = 7) => get<MoodDay[]>(`/progress/mood?days=${days}`),

  // Demo helpers
  seedDemo: () => post<unknown>('/dev/seed-demo'),
  reset: () => post<unknown>('/dev/reset'),

  // Caregiver & clinical insights
  caregiverInsights: (days = 7) => get<CaregiverInsights>(`/caregiver/insights?days=${days}`),
  caregiverAlerts: () => get<CaregiverAlert[]>('/caregiver/alerts'),
  acknowledgeAlert: (id: number) => post<CaregiverAlert>(`/caregiver/alerts/${id}/acknowledge`),
  supportRecommendations: () => get<SupportRecommendations>('/support/recommendations'),
}
