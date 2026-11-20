// In-browser fake backend. It answers the same URLs with the same JSON shapes as the REAL FastAPI backend
// (backend/app/schemas/*.py), so switching VITE_API_MODE to "real" changes nothing in the UI.
// State lives in localStorage so a page refresh keeps your edits.
//
// Honesty note: everything here is derived from what you do in the app (sessions, check-ins).
// The ONLY fabricated data is "Load demo data" (Settings > Demo tools), which mirrors the backend's
// /api/dev/seed-demo and is clearly an opt-in action.
import type { Checklist, ChecklistItem, MoodDay, Profile, Schedule, Step, Task, Template } from './types'
import { ApiError } from './types'

type Json = unknown
interface MockCheckin { id: number; at: string; emoji: string; focus: number; emotion: number; label: string; text: string | null }
interface Db {
  nextId: number
  profile: Profile | null
  schedules: Schedule[]
  checklists: Checklist[]
  checkins: MockCheckin[]
  points: number
  streak: number
  bestStreak: number
  lastStreakDay: string | null
  doneLog: string[]                       // ISO timestamps of finished tasks
  sessions: Record<number, { task_id: number; started: number; done: number[] }>
}

const KEY = 'bloomai-mock-db-v2'
const POINTS_PER_STEP = 5
const SESSION_BONUS = 10

// ---------- preset templates: same names, colours, icons and shape as backend/seed/presets.py ----------
const TEMPLATES: Template[] = [
  { id: 1, type: 'schedule', name: 'Morning Routine', color: '#F4A261', icon: 'sun', data: { tasks: [
    { title: 'Brush teeth', icon: 'tooth', order: 1, expected_seconds: 120, steps: [{ text: 'Put paste on brush', icon: 'paste' }, { text: 'Brush all teeth gently', icon: 'sparkles' }, { text: 'Rinse mouth with water', icon: 'water' }] },
    { title: 'Wash face', icon: 'droplet', order: 2, expected_seconds: 90, steps: [{ text: 'Splash face with warm water', icon: 'water' }, { text: 'Pat dry with clean towel', icon: 'towel' }] },
    { title: 'Put on school uniform', icon: 'shirt', order: 3, expected_seconds: 180, steps: [{ text: 'Put on shirt and pants', icon: 'shirt' }, { text: 'Put on socks and shoes', icon: 'shoes' }] },
    { title: 'Eat healthy breakfast', icon: 'apple', order: 4, expected_seconds: 600, steps: [{ text: 'Sit at table and enjoy breakfast', icon: 'food' }, { text: 'Drink a glass of water', icon: 'glass' }] },
  ] } },
  { id: 2, type: 'schedule', name: 'Homework Focus', color: '#2A9D8F', icon: 'book', data: { tasks: [
    { title: 'Clear workspace', icon: 'sparkles', order: 1, expected_seconds: 60, steps: [{ text: 'Put away distraction items', icon: 'cross' }, { text: 'Take out pencil and notebook', icon: 'pencil' }] },
    { title: 'Do homework page', icon: 'book-open', order: 2, expected_seconds: 600, steps: [{ text: 'Read the instructions carefully', icon: 'eye' }, { text: 'Answer questions one by one', icon: 'pencil' }, { text: 'Check all answers once', icon: 'check' }] },
    { title: 'Pack bag for tomorrow', icon: 'backpack', order: 3, expected_seconds: 120, steps: [{ text: 'Zip notebook into backpack', icon: 'backpack' }, { text: 'Put pencil case in front pocket', icon: 'pencil' }] },
  ] } },
  { id: 3, type: 'schedule', name: 'Bedtime Calm', color: '#4A6FA5', icon: 'moon', data: { tasks: [
    { title: 'Tidy room', icon: 'home', order: 1, expected_seconds: 180, steps: [{ text: 'Put toys in toy bin', icon: 'box' }, { text: 'Put books on shelf', icon: 'book' }] },
    { title: 'Get ready for bed', icon: 'moon', order: 2, expected_seconds: 240, steps: [{ text: 'Brush teeth for 2 minutes', icon: 'tooth' }, { text: 'Put on cozy pajamas', icon: 'shirt' }] },
    { title: 'Story and relax', icon: 'book-open', order: 3, expected_seconds: 300, steps: [{ text: 'Read one short story', icon: 'book' }, { text: 'Turn off lights and rest', icon: 'moon' }] },
  ] } },
  { id: 4, type: 'checklist', name: 'School Bag Never-Forget', color: '#E76F51', icon: 'backpack', data: { reminder_time: '07:45', items: [
    { text: 'Water bottle (filled)', icon: 'water' }, { text: 'Math notebook & homework', icon: 'book' }, { text: 'Pencil case (sharpener, eraser)', icon: 'pencil' },
    { text: 'Snack box / lunch', icon: 'apple' }, { text: 'School ID / bus pass', icon: 'card' },
  ] } },
  { id: 5, type: 'checklist', name: 'Sports Day Kit', color: '#2A9D8F', icon: 'trophy', data: { reminder_time: '08:00', items: [
    { text: 'Sports shoes on', icon: 'shoes' }, { text: 'Extra sports drink / water', icon: 'water' }, { text: 'Sun cap / hat', icon: 'sun' }, { text: 'Clean small towel', icon: 'towel' },
  ] } },
]

const PRAISE = [
  'You kept going on that step, {name}. Nice effort!',
  'Look at you, {name}! One more step done.',
  'That took focus, {name}. Well done!',
  'Great trying, {name}. Keep it up!',
  'You did it, {name}! Small steps add up.',
]
const CALM: Record<string, { message: string; suggested_activity: string }> = {
  angry: { message: "It is completely normal to feel upset. Let's take three slow breaths together.", suggested_activity: 'breathing' },
  worried: { message: 'Big feelings can feel heavy, {name}. Shake out your hands and take a breath.', suggested_activity: 'movement' },
  tired: { message: 'Your brain worked hard today. Stretch your arms up to the sky and rest a minute.', suggested_activity: 'stretching' },
  sad: { message: "It's okay to feel sad right now, {name}. You are safe and doing your best.", suggested_activity: 'breathing' },
  calm: { message: "You're in a great calm space. Keep this gentle rhythm going!", suggested_activity: 'none' },
  happy: { message: 'Love seeing that smile, {name}! Let\'s ride this positive wave!', suggested_activity: 'none' },
}
// Same idea as backend/app/scoring/formula.py (simplified): emoji base score, small text adjustment.
const EMOJI_BASE: Record<string, number> = { calm: 90, happy: 85, tired: 50, worried: 40, sad: 30, angry: 20 }
const LABELS: Record<string, string> = { calm: 'calm', happy: 'engaged', tired: 'tired', worried: 'anxious', sad: 'low', angry: 'frustrated' }
// Same phrases as backend/app/safety/distress_detector.py
const DISTRESS = [/\bhate myself\b/, /\bwant to disappear\b/, /\bkill myself\b/, /\bhurt myself\b/, /\bi am stupid\b/, /\bi am dumb\b/, /\bi am worthless\b/, /\bnobody likes me\b/, /\bi want to cry\b/, /\bcan'?t do anything right\b/, /\bpunish me\b/, /\bhate my life\b/]
const FRUSTRATION = [/\bhate this\b/, /\bgive up\b/, /\bhate everything\b/, /\bcan'?t do it\b/, /\bleave me alone\b/]
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

// ---------- storage ----------
function empty(): Db {
  return { nextId: 1000, profile: null, schedules: [], checklists: [], checkins: [], points: 0, streak: 0, bestStreak: 0, lastStreakDay: null, doneLog: [], sessions: {} }
}
function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* ignore */ }
  const db = empty()
  db.schedules.push(scheduleFrom(db, TEMPLATES[0]))
  db.checklists.push(checklistFrom(db, TEMPLATES[3]))
  return db
}
let db: Db = load()
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignore */ } }
const id = () => db.nextId++

function scheduleFrom(d: Db, t: Template, over: Partial<Schedule> = {}): Schedule {
  return {
    id: d.nextId++, name: over.name ?? t.name, color: over.color ?? t.color, icon: over.icon ?? t.icon,
    tasks: (t.data.tasks ?? []).map((k, i): Task => ({
      id: d.nextId++, title: k.title, icon: k.icon, order: k.order ?? i + 1, expected_seconds: k.expected_seconds ?? 120,
      steps: (k.steps ?? []).map((s, j): Step => ({ id: d.nextId++, text: s.text, icon: s.icon, order: s.order ?? j + 1 })),
    })),
  }
}
function checklistFrom(d: Db, t: Template, name?: string, reminder?: string): Checklist {
  return {
    id: d.nextId++, name: name ?? t.name, reminder_time: reminder ?? t.data.reminder_time ?? '08:00',
    items: (t.data.items ?? []).map((i, idx): ChecklistItem => ({ id: d.nextId++, text: i.text, icon: i.icon, is_checked: false, order: i.order ?? idx + 1 })),
  }
}

// ---------- helpers ----------
const notFound = (what: string) => new ApiError(404, `${what} not found`)
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order
function findSchedule(sid: number) { const s = db.schedules.find((x) => x.id === sid); if (!s) throw notFound(`Schedule ${sid}`); return s }
function findTask(tid: number) {
  for (const s of db.schedules) { const t = s.tasks.find((x) => x.id === tid); if (t) return { s, t } }
  throw notFound(`Task ${tid}`)
}
function findStep(stid: number) {
  for (const s of db.schedules) for (const t of s.tasks) { const st = t.steps.find((x) => x.id === stid); if (st) return { t, st } }
  throw notFound(`Step ${stid}`)
}
function findChecklist(cid: number) { const c = db.checklists.find((x) => x.id === cid); if (!c) throw notFound(`Checklist ${cid}`); return c }
const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const nextOrder = (arr: { order: number }[]) => Math.max(0, ...arr.map((x) => x.order)) + 1

type Body = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function updateStreak() {
  const today = dayKey(new Date())
  if (db.lastStreakDay !== today) {
    const yesterday = dayKey(new Date(Date.now() - 864e5))
    db.streak = db.lastStreakDay === yesterday ? db.streak + 1 : 1
    db.lastStreakDay = today
  }
  db.bestStreak = Math.max(db.bestStreak, db.streak)
}
function summarise(c: MockCheckin) { return { id: c.id, focus_score: c.focus, emotion_score: c.emotion, label: c.label, created_at: c.at } }

// ---------- router ----------
export async function mockRequest(method: string, path: string, body?: Body): Promise<Json> {
  await new Promise((r) => setTimeout(r, 120))     // feel like a network call; exercises loading states
  const [route, queryStr = ''] = path.split('?')
  const q = new URLSearchParams(queryStr)
  const m = (pattern: string) => {
    const re = new RegExp('^' + pattern.replace(/:\w+/g, '(\\d+)') + '$')
    const hit = route.match(re)
    return hit ? hit.slice(1).map(Number) : null
  }
  const is = (verb: string, pattern: string) => (method === verb ? m(pattern) : null)
  let p: number[] | null
  const b = body ?? {}

  // System
  if (is('GET', '/health')) return { status: 'ok', app: 'BloomAI Mock', version: 'mock' }
  if (is('POST', '/dev/reset')) { localStorage.removeItem(KEY); db = load(); return { message: 'Database reset to initial template state' } }
  if (is('POST', '/dev/seed-demo')) {
    // Mirrors backend/seed/demo_data.py in spirit: demo profile stats + 14 days of sample check-ins.
    TEMPLATES.slice(1, 3).forEach((t) => db.schedules.push(scheduleFrom(db, t)))
    db.checklists.push(checklistFrom(db, TEMPLATES[4]))
    db.points = 245; db.streak = 5; db.bestStreak = 7; db.lastStreakDay = dayKey(new Date())
    const emojis = ['happy', 'calm', 'happy', 'calm', 'tired', 'worried']
    db.checkins = []
    for (let off = 13; off >= 0; off--) {
      const e = emojis[(off * 7) % emojis.length]
      const emotion = clamp(EMOJI_BASE[e] + ((off * 13) % 11) - 5)
      const focus = clamp(72 + ((off * 17) % 21) - 10 - (e === 'tired' ? 12 : 0))
      db.checkins.push({ id: id(), at: new Date(Date.now() - off * 864e5).toISOString(), emoji: e, focus, emotion, label: LABELS[e], text: null })
      db.doneLog.push(new Date(Date.now() - off * 864e5).toISOString())
    }
    save(); return { message: 'Demo data seeded successfully', days_seeded: 14, profile: db.profile?.name ?? 'Aarav' }
  }

  // Profile
  if (is('GET', '/profile')) { if (!db.profile) throw new ApiError(404, 'Profile not found'); return clone(db.profile) }
  if (is('POST', '/profile')) { db.profile = { id: 1, name: b.name, avatar: b.avatar ?? 'star', favourite_rewards: b.favourite_rewards ?? [] }; save(); return clone(db.profile) }
  if (is('PUT', '/profile')) { if (!db.profile) throw new ApiError(404, 'Profile not found'); db.profile = { ...db.profile, ...b, id: 1 }; save(); return clone(db.profile) }

  // Templates
  if (is('GET', '/templates')) { const type = q.get('type'); return clone(TEMPLATES.filter((t) => !type || t.type === type)) }

  // Schedules (the list is fully nested, like the real backend)
  if (is('GET', '/schedules')) return clone(db.schedules.map((s) => ({ ...s, tasks: [...s.tasks].sort(byOrder).map((t) => ({ ...t, steps: [...t.steps].sort(byOrder) })) })))
  if (is('POST', '/schedules')) {
    let s: Schedule
    if (b.template_id) {
      const tpl = TEMPLATES.find((t) => t.id === b.template_id && t.type === 'schedule'); if (!tpl) throw notFound(`Schedule template with ID ${b.template_id}`)
      s = scheduleFrom(db, tpl, { name: b.name, color: b.color, icon: b.icon })
    } else {
      if (!b.name) throw new ApiError(422, 'Schedule name is required when not using a template')
      s = { id: id(), name: b.name, color: b.color || '#F4A261', icon: b.icon || 'sun', tasks: [] }
    }
    db.schedules.push(s); save(); return clone(s)
  }
  if ((p = is('GET', '/schedules/:id'))) { const s = findSchedule(p[0]); s.tasks.sort(byOrder); s.tasks.forEach((t) => t.steps.sort(byOrder)); return clone(s) }
  if ((p = is('PUT', '/schedules/:id'))) { const s = findSchedule(p[0]); Object.assign(s, { name: b.name ?? s.name, color: b.color ?? s.color, icon: b.icon ?? s.icon }); save(); return clone(s) }
  if ((p = is('DELETE', '/schedules/:id'))) { findSchedule(p[0]); db.schedules = db.schedules.filter((x) => x.id !== p![0]); save(); return { message: `Schedule ${p[0]} deleted successfully` } }

  // Tasks
  if ((p = is('PUT', '/schedules/:id/tasks/reorder'))) {
    const s = findSchedule(p[0]); const ids: number[] = b.ordered_task_ids ?? []
    ids.forEach((tid, i) => { const t = s.tasks.find((x) => x.id === tid); if (t) t.order = i + 1 })
    s.tasks.sort(byOrder); save(); return clone(s)
  }
  if ((p = is('POST', '/schedules/:id/tasks'))) {
    const s = findSchedule(p[0])
    const t: Task = { id: id(), title: b.title || 'New task', icon: b.icon || 'star', order: b.order > 1 ? b.order : nextOrder(s.tasks), expected_seconds: b.expected_seconds ?? 120, steps: [] }
    s.tasks.push(t); save(); return clone(t)
  }
  if ((p = is('PUT', '/tasks/:id'))) { const { t } = findTask(p[0]); Object.assign(t, { title: b.title ?? t.title, icon: b.icon ?? t.icon, order: b.order ?? t.order, expected_seconds: b.expected_seconds ?? t.expected_seconds }); save(); return clone(t) }
  if ((p = is('DELETE', '/tasks/:id'))) { const { s } = findTask(p[0]); s.tasks = s.tasks.filter((x) => x.id !== p![0]); save(); return { message: `Task ${p[0]} deleted successfully` } }

  // Steps (note: like the backend, PUT order sets the value directly; callers swap two steps' orders)
  if ((p = is('POST', '/tasks/:id/steps'))) {
    const { t } = findTask(p[0]); const st: Step = { id: id(), text: b.text || 'New step', icon: b.icon || 'check', order: b.order > 1 ? b.order : nextOrder(t.steps) }
    t.steps.push(st); save(); return clone(st)
  }
  if ((p = is('PUT', '/steps/:id'))) {
    const { t, st } = findStep(p[0]); Object.assign(st, { text: b.text ?? st.text, icon: b.icon ?? st.icon, order: b.order ?? st.order })
    t.steps.sort(byOrder); save(); return clone(st)
  }
  if ((p = is('DELETE', '/steps/:id'))) { const { t } = findStep(p[0]); t.steps = t.steps.filter((x) => x.id !== p![0]); save(); return { message: `Step ${p[0]} deleted successfully` } }

  // Checklists
  if (is('GET', '/checklists')) return clone(db.checklists.map((c) => ({ ...c, items: [...c.items].sort(byOrder) })))
  if (is('POST', '/checklists')) {
    let c: Checklist
    if (b.template_id) {
      const tpl = TEMPLATES.find((t) => t.id === b.template_id && t.type === 'checklist'); if (!tpl) throw notFound(`Checklist template with ID ${b.template_id}`)
      c = checklistFrom(db, tpl, b.name || undefined, b.reminder_time)
    } else {
      if (!b.name) throw new ApiError(422, 'Checklist name is required')
      c = { id: id(), name: b.name, reminder_time: b.reminder_time || '08:00', items: [] }
    }
    db.checklists.push(c); save(); return clone(c)
  }
  if ((p = is('PUT', '/checklists/:id'))) { const c = findChecklist(p[0]); Object.assign(c, { name: b.name ?? c.name, reminder_time: b.reminder_time ?? c.reminder_time }); save(); return clone(c) }
  if ((p = is('DELETE', '/checklists/:id'))) { findChecklist(p[0]); db.checklists = db.checklists.filter((x) => x.id !== p![0]); save(); return { message: `Checklist ${p[0]} deleted successfully` } }
  if ((p = is('POST', '/checklists/:id/items'))) { const c = findChecklist(p[0]); const it: ChecklistItem = { id: id(), checklist_id: c.id, text: b.text || 'New item', icon: b.icon || 'check', is_checked: false, order: b.order > 1 ? b.order : nextOrder(c.items) }; c.items.push(it); save(); return clone(it) }
  if ((p = is('POST', '/checklists/:id/reset'))) { const c = findChecklist(p[0]); c.items.forEach((i) => { i.is_checked = false }); save(); return clone(c) }
  if ((p = is('PUT', '/checklist-items/:id'))) {
    for (const c of db.checklists) { const it = c.items.find((x) => x.id === p![0]); if (it) { Object.assign(it, { text: b.text ?? it.text, icon: b.icon ?? it.icon, is_checked: b.is_checked ?? it.is_checked, order: b.order ?? it.order }); save(); return clone(it) } }
    throw notFound(`Checklist item ${p[0]}`)
  }
  if ((p = is('DELETE', '/checklist-items/:id'))) {
    for (const c of db.checklists) if (c.items.some((x) => x.id === p![0])) { c.items = c.items.filter((x) => x.id !== p![0]); save(); return { message: `Checklist item ${p[0]} deleted successfully` } }
    throw notFound(`Checklist item ${p[0]}`)
  }

  // Sessions
  if (is('POST', '/sessions')) {
    const { t } = findTask(b.task_id); const sid = id(); db.sessions[sid] = { task_id: t.id, started: Date.now(), done: [] }; save()
    return { session_id: sid, task_id: t.id, started_at: new Date(db.sessions[sid].started).toISOString(), expected_seconds: t.expected_seconds }
  }
  if ((p = is('POST', '/sessions/:id/steps/:id/complete'))) {
    const sess = db.sessions[p[0]]; if (!sess) throw notFound(`Session ${p[0]}`)
    const { t } = findTask(sess.task_id)
    sess.done.push(p[1]); db.points += POINTS_PER_STEP; updateStreak(); save()
    return { points_awarded: POINTS_PER_STEP, total_points: db.points, streak: db.streak, steps_remaining: Math.max(0, t.steps.length - sess.done.length) }
  }
  if ((p = is('POST', '/sessions/:id/end'))) {
    const sess = db.sessions[p[0]]; if (!sess) throw notFound(`Session ${p[0]}`)
    const { t } = findTask(sess.task_id)
    const secs = Math.max(0, Math.round((Date.now() - sess.started) / 1000))
    db.points += SESSION_BONUS; updateStreak()
    db.doneLog.push(new Date().toISOString()); delete db.sessions[p[0]]; save()
    return { duration_seconds: secs, expected_seconds: t.expected_seconds, bonus_points: SESSION_BONUS, total_points: db.points }
  }

  // Check-ins, AI, safety, progress
  if (is('POST', '/checkins')) {
    const text = (b.text ?? '').toString().toLowerCase().trim()
    const emoji = String(b.emoji ?? 'calm').toLowerCase()
    const emotion = clamp((EMOJI_BASE[emoji] ?? 60) + (/\b(love|great|fun|happy|good|proud)\b/.test(text) ? 5 : 0) - (/\b(hate|bad|angry|boring|hard|stupid)\b/.test(text) ? 7 : 0))
    const safe = text.length > 0 && (DISTRESS.some((r) => r.test(text)) || (emotion <= 25 && FRUSTRATION.some((r) => r.test(text))))
    const focus = clamp(75 + (emotion >= 70 ? 10 : emotion < 40 ? -15 : 0))
    const c: MockCheckin = { id: id(), at: new Date().toISOString(), emoji, focus, emotion, label: safe ? 'distressed' : LABELS[emoji] ?? 'calm', text: b.text ?? null }
    db.checkins.push(c); save()
    return { ...summarise(c), safe_mode: safe }
  }
  if (is('GET', '/checkins')) { const days = Number(q.get('days') ?? 7); return db.checkins.filter((c) => Date.now() - new Date(c.at).getTime() < days * 864e5).map((c) => ({ ...summarise(c), safe_mode: c.label === 'distressed' })).reverse() }
  if (is('POST', '/praise')) return { message: PRAISE[Math.floor(Math.random() * PRAISE.length)].replace('{name}', b.child_name ?? 'friend'), source: 'template' }
  if (is('POST', '/chat')) return { message: "I'm listening! You are doing wonderfully.", source: 'template' }
  if (is('POST', '/calm-reply')) { const r = CALM[b.emoji] ?? CALM.calm; return { message: r.message.replace('{name}', b.child_name ?? 'friend'), suggested_activity: r.suggested_activity, source: 'template' } }
  if (is('GET', '/safety/resources')) {
    return { message: 'It sounds like today is hard. Please talk to a trusted adult.', resources: [{ name: 'Childline (UK)', contact: '0800 1111' }, { name: 'Kids Helpline', contact: '1800 55 1800' }, { name: 'Crisis Text Line', contact: 'Text HOME to 741741' }] }
  }
  if (is('GET', '/progress/summary')) {
    const day = dayKey(new Date()); const weekAgo = Date.now() - 7 * 864e5
    return {
      total_points: db.points, current_streak: db.streak, best_streak: db.bestStreak,
      tasks_completed_today: db.doneLog.filter((d) => d.slice(0, 10) === day).length,
      tasks_completed_week: db.doneLog.filter((d) => new Date(d).getTime() > weekAgo).length,
    }
  }
  if (is('GET', '/progress/mood')) {
    const days = Number(q.get('days') ?? 7); const since = Date.now() - days * 864e5
    const grouped = new Map<string, MockCheckin[]>()
    db.checkins.filter((c) => new Date(c.at).getTime() >= since).sort((a, c) => a.at.localeCompare(c.at)).forEach((c) => { const k = c.at.slice(0, 10); grouped.set(k, [...(grouped.get(k) ?? []), c]) })
    const avg = (xs: number[]) => Math.round(xs.reduce((a, x) => a + x, 0) / xs.length)
    return [...grouped.entries()].map(([date, cs]): MoodDay => ({ date, avg_emotion_score: avg(cs.map((c) => c.emotion)), avg_focus_score: avg(cs.map((c) => c.focus)), checkins: cs.length }))
  }

  throw new ApiError(404, `Mock has no route for ${method} ${path}`)
}
