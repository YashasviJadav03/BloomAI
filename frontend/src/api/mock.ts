// In-browser fake backend. It answers the same URLs and returns the same JSON
// shapes as the contract, so switching to the real API changes nothing in the UI.
// State lives in localStorage so a page refresh keeps your edits.
import type { Checklist, Profile, Schedule, Step, Task, Template } from './types'
import { ApiError } from './types'

type Json = unknown
interface Db {
  nextId: number
  profile: Profile | null
  schedules: Schedule[]
  checklists: Checklist[]
  points: number
  streak: number
  bestStreak: number
  lastStreakDay: string | null
  doneLog: string[]                       // ISO timestamps of finished tasks
  sessions: Record<number, { task_id: number; started: number }>
}

const KEY = 'bloomai-mock-db-v1'
const POINTS_PER_STEP = 5

// ---------- preset templates (the real ones come from A's seed script) ----------
interface TaskTpl { title: string; icon: string; secs: number; steps: [string, string][] }
interface SchedTpl { name: string; color: string; icon: string; description: string; tasks: TaskTpl[] }
const SCHEDULE_TEMPLATES: SchedTpl[] = [
  {
    name: 'Morning', color: '#F4A261', icon: 'sun', description: 'Wake up, wash, dress, eat',
    tasks: [
      { title: 'Brush teeth', icon: 'tooth', secs: 120, steps: [['Wet your toothbrush', 'water'], ['Put paste on brush', 'paste'], ['Brush top and bottom teeth', 'tooth'], ['Rinse and spit', 'water']] },
      { title: 'Get dressed', icon: 'shirt', secs: 300, steps: [['Pick your clothes', 'shirt'], ['Put on your shirt and trousers', 'shirt'], ['Put on socks and shoes', 'shoes']] },
      { title: 'Eat breakfast', icon: 'breakfast', secs: 600, steps: [['Sit at the table', 'breakfast'], ['Eat your breakfast', 'breakfast'], ['Put your bowl in the sink', 'soap']] },
      { title: 'Pack your bag', icon: 'bag', secs: 180, steps: [['Put your books in the bag', 'book'], ['Add your water bottle', 'bottle'], ['Zip up the bag', 'bag']] },
    ],
  },
  {
    name: 'Homework', color: '#6AA9D8', icon: 'book', description: 'Set up, do it in small steps, pack up',
    tasks: [
      { title: 'Set up desk', icon: 'pencil', secs: 180, steps: [['Clear your desk', 'broom'], ['Get a pencil and your book', 'pencil'], ['Put your phone away', 'cloud']] },
      { title: 'Maths worksheet', icon: 'calculator', secs: 900, steps: [['Write the date', 'calendar'], ['Read question 1', 'read'], ['Do question 1', 'pencil'], ['Check your answer', 'check']] },
      { title: 'Reading', icon: 'read', secs: 600, steps: [['Open your book', 'book'], ['Read one page', 'read'], ['Tell someone one thing you learned', 'face']] },
      { title: 'Pack up', icon: 'bag', secs: 120, steps: [['Put everything in your bag', 'bag'], ['Tidy your desk', 'broom']] },
    ],
  },
  {
    name: 'Bedtime', color: '#9B8AD1', icon: 'moon', description: 'Wind down, wash, story, sleep',
    tasks: [
      { title: 'Tidy toys', icon: 'toy', secs: 300, steps: [['Put toys in the box', 'toy'], ['Check the floor is clear', 'broom']] },
      { title: 'Wash and brush', icon: 'tooth', secs: 240, steps: [['Wash your face', 'soap'], ['Brush your teeth', 'tooth']] },
      { title: 'Pajamas on', icon: 'pajamas', secs: 180, steps: [['Take off today\'s clothes', 'shirt'], ['Put on pajamas', 'pajamas']] },
      { title: 'Story time', icon: 'story', secs: 600, steps: [['Pick a story', 'story'], ['Get into bed', 'bed'], ['Lights off', 'light']] },
    ],
  },
]
interface ChecklistTpl { name: string; icon: string; reminder: string; items: [string, string][]; description: string }
const CHECKLIST_TEMPLATES: ChecklistTpl[] = [
  { name: 'After-school pack-up', icon: 'bag', reminder: '15:30', description: 'Bring everything home',
    items: [['Lunchbox', 'lunchbox'], ['Water bottle', 'bottle'], ['Jacket', 'jacket'], ['Homework book', 'homework'], ['Pencil case', 'pencil']] },
  { name: 'Ready for school', icon: 'school', reminder: '07:15', description: 'Before leaving home',
    items: [['School bag', 'bag'], ['Lunchbox', 'lunchbox'], ['Water bottle', 'bottle'], ['Shoes on', 'shoes']] },
]

const PRAISE = [
  'You kept going on that step, {name}. Nice effort!',
  'Look at you, {name}! One more step done.',
  'That took focus, {name}. Well done!',
  'Great trying, {name}. Keep it up!',
  'You did it, {name}! Small steps add up.',
]

// ---------- storage ----------
function empty(): Db {
  return { nextId: 1000, profile: null, schedules: [], checklists: [], points: 0, streak: 0, bestStreak: 0, lastStreakDay: null, doneLog: [], sessions: {} }
}
function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* ignore */ }
  const db = empty()
  // pre-seed one schedule + one checklist so the demo is not empty
  db.schedules.push(buildSchedule(db, SCHEDULE_TEMPLATES[0]))
  db.checklists.push(buildChecklist(db, CHECKLIST_TEMPLATES[0]))
  return db
}
let db: Db = load()
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignore */ }
}
const id = () => db.nextId++

function buildSchedule(d: Db, t: SchedTpl): Schedule {
  const sid = d.nextId++
  return {
    id: sid, name: t.name, color: t.color, icon: t.icon,
    tasks: t.tasks.map((k, i): Task => ({
      id: d.nextId++, title: k.title, icon: k.icon, order: i + 1, expected_seconds: k.secs,
      steps: k.steps.map(([text, icon], j): Step => ({ id: d.nextId++, text, icon, order: j + 1 })),
    })),
  }
}
function buildChecklist(d: Db, t: ChecklistTpl): Checklist {
  return {
    id: d.nextId++, name: t.name, icon: t.icon, reminder_time: t.reminder,
    items: t.items.map(([text, icon]) => ({ id: d.nextId++, text, icon, checked: false })),
  }
}

// ---------- helpers ----------
const notFound = (what: string) => new ApiError(404, `${what} not found`)
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
function findSchedule(sid: number) { const s = db.schedules.find((x) => x.id === sid); if (!s) throw notFound('Schedule'); return s }
function findTask(tid: number) {
  for (const s of db.schedules) { const t = s.tasks.find((x) => x.id === tid); if (t) return { s, t } }
  throw notFound('Task')
}
function findStep(stid: number) {
  for (const s of db.schedules) for (const t of s.tasks) { const st = t.steps.find((x) => x.id === stid); if (st) return { t, st } }
  throw notFound('Step')
}
function findChecklist(cid: number) { const c = db.checklists.find((x) => x.id === cid); if (!c) throw notFound('Checklist'); return c }
const renumber = (arr: { order: number }[]) => arr.forEach((x, i) => { x.order = i + 1 })
const today = () => new Date().toISOString().slice(0, 10)

type Body = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

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
  if (is('GET', '/health')) return { status: 'ok' }
  if (is('POST', '/dev/reset')) { localStorage.removeItem(KEY); db = load(); return { status: 'reset' } }
  if (is('POST', '/dev/seed-demo')) {
    SCHEDULE_TEMPLATES.slice(1).forEach((t) => db.schedules.push(buildSchedule(db, t)))
    CHECKLIST_TEMPLATES.slice(1).forEach((t) => db.checklists.push(buildChecklist(db, t)))
    db.points = Math.max(db.points, 120); db.streak = 3; db.bestStreak = 5
    save(); return { status: 'seeded' }
  }

  // Profile
  if (is('GET', '/profile')) { if (!db.profile) throw notFound('Profile'); return clone(db.profile) }
  if (is('POST', '/profile')) { db.profile = { id: 1, name: b.name, avatar: b.avatar, favourite_rewards: b.favourite_rewards ?? [] }; save(); return clone(db.profile) }
  if (is('PUT', '/profile')) { if (!db.profile) throw notFound('Profile'); db.profile = { ...db.profile, ...b, id: 1 }; save(); return clone(db.profile) }

  // Templates
  if (is('GET', '/templates')) {
    const type = q.get('type')
    const out: Template[] = []
    if (type !== 'checklist') SCHEDULE_TEMPLATES.forEach((t, i) => out.push({ id: i + 1, type: 'schedule', name: t.name, color: t.color, icon: t.icon, description: t.description }))
    if (type !== 'schedule') CHECKLIST_TEMPLATES.forEach((t, i) => out.push({ id: i + 1, type: 'checklist', name: t.name, icon: t.icon, description: t.description }))
    return out
  }

  // Schedules
  if (is('GET', '/schedules')) return clone(db.schedules)
  if (is('POST', '/schedules')) {
    let s: Schedule
    if (b.template_id) {
      const tpl = SCHEDULE_TEMPLATES[b.template_id - 1]; if (!tpl) throw notFound('Template')
      s = buildSchedule(db, { ...tpl, name: b.name ?? tpl.name, color: b.color ?? tpl.color, icon: b.icon ?? tpl.icon })
    } else s = { id: id(), name: b.name || 'My schedule', color: b.color || '#6AA9D8', icon: b.icon || 'star', tasks: [] }
    db.schedules.push(s); save(); return clone(s)
  }
  if ((p = is('GET', '/schedules/:id'))) return clone(findSchedule(p[0]))
  if ((p = is('PUT', '/schedules/:id'))) { const s = findSchedule(p[0]); Object.assign(s, { name: b.name ?? s.name, color: b.color ?? s.color, icon: b.icon ?? s.icon }); save(); return clone(s) }
  if ((p = is('DELETE', '/schedules/:id'))) { findSchedule(p[0]); db.schedules = db.schedules.filter((x) => x.id !== p![0]); save(); return { status: 'deleted' } }

  // Tasks
  if ((p = is('PUT', '/schedules/:id/tasks/reorder'))) {
    const s = findSchedule(p[0]); const ids: number[] = b.task_ids ?? []
    s.tasks.sort((a, c) => ids.indexOf(a.id) - ids.indexOf(c.id)); renumber(s.tasks); save(); return clone(s)
  }
  if ((p = is('POST', '/schedules/:id/tasks'))) {
    const s = findSchedule(p[0])
    const t: Task = { id: id(), title: b.title || 'New task', icon: b.icon || 'star', order: s.tasks.length + 1, expected_seconds: b.expected_seconds ?? 300, steps: [] }
    s.tasks.push(t); save(); return clone(t)
  }
  if ((p = is('PUT', '/tasks/:id'))) { const { t } = findTask(p[0]); Object.assign(t, { title: b.title ?? t.title, icon: b.icon ?? t.icon, expected_seconds: b.expected_seconds ?? t.expected_seconds }); save(); return clone(t) }
  if ((p = is('DELETE', '/tasks/:id'))) { const { s } = findTask(p[0]); s.tasks = s.tasks.filter((x) => x.id !== p![0]); renumber(s.tasks); save(); return { status: 'deleted' } }

  // Steps
  if ((p = is('POST', '/tasks/:id/steps'))) {
    const { t } = findTask(p[0]); const st: Step = { id: id(), text: b.text || 'New step', icon: b.icon || 'check', order: t.steps.length + 1 }
    t.steps.push(st); save(); return clone(st)
  }
  if ((p = is('PUT', '/steps/:id'))) {
    const { t, st } = findStep(p[0]); Object.assign(st, { text: b.text ?? st.text, icon: b.icon ?? st.icon })
    if (typeof b.order === 'number') { t.steps.sort((a, c) => (a === st ? b.order - 0.5 : a.order) - (c === st ? b.order - 0.5 : c.order)); renumber(t.steps) }
    save(); return clone(st)
  }
  if ((p = is('DELETE', '/steps/:id'))) { const { t } = findStep(p[0]); t.steps = t.steps.filter((x) => x.id !== p![0]); renumber(t.steps); save(); return { status: 'deleted' } }

  // Checklists
  if (is('GET', '/checklists')) return clone(db.checklists)
  if (is('POST', '/checklists')) {
    let c: Checklist
    if (b.template_id) { const tpl = CHECKLIST_TEMPLATES[b.template_id - 1]; if (!tpl) throw notFound('Template'); c = buildChecklist(db, { ...tpl, name: b.name ?? tpl.name }) }
    else c = { id: id(), name: b.name || 'My checklist', icon: b.icon || 'check', reminder_time: b.reminder_time ?? null, items: [] }
    db.checklists.push(c); save(); return clone(c)
  }
  if ((p = is('PUT', '/checklists/:id'))) { const c = findChecklist(p[0]); Object.assign(c, { name: b.name ?? c.name, icon: b.icon ?? c.icon }); if ('reminder_time' in b) c.reminder_time = b.reminder_time; save(); return clone(c) }
  if ((p = is('DELETE', '/checklists/:id'))) { findChecklist(p[0]); db.checklists = db.checklists.filter((x) => x.id !== p![0]); save(); return { status: 'deleted' } }
  if ((p = is('POST', '/checklists/:id/items'))) { const c = findChecklist(p[0]); const it = { id: id(), text: b.text || 'New item', icon: b.icon || 'check', checked: false }; c.items.push(it); save(); return clone(it) }
  if ((p = is('POST', '/checklists/:id/reset'))) { const c = findChecklist(p[0]); c.items.forEach((i) => { i.checked = false }); save(); return clone(c) }
  if ((p = is('PUT', '/checklist-items/:id'))) {
    for (const c of db.checklists) { const it = c.items.find((x) => x.id === p![0]); if (it) { Object.assign(it, { text: b.text ?? it.text, icon: b.icon ?? it.icon, checked: b.checked ?? it.checked }); save(); return clone(it) } }
    throw notFound('Item')
  }
  if ((p = is('DELETE', '/checklist-items/:id'))) {
    for (const c of db.checklists) if (c.items.some((x) => x.id === p![0])) { c.items = c.items.filter((x) => x.id !== p![0]); save(); return { status: 'deleted' } }
    throw notFound('Item')
  }

  // Sessions
  if (is('POST', '/sessions')) {
    const { t } = findTask(b.task_id); const sid = id(); db.sessions[sid] = { task_id: t.id, started: Date.now() }; save()
    return { session_id: sid, task_id: t.id, started_at: new Date(db.sessions[sid].started).toISOString(), expected_seconds: t.expected_seconds }
  }
  if ((p = is('POST', '/sessions/:id/steps/:id/complete'))) {
    const sess = db.sessions[p[0]]; if (!sess) throw notFound('Session')
    const { t } = findTask(sess.task_id)
    const done = ((sess as any).done ??= []) as number[] // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!done.includes(p[1])) { done.push(p[1]); db.points += POINTS_PER_STEP }
    save()
    return { points_awarded: POINTS_PER_STEP, total_points: db.points, streak: db.streak, steps_remaining: t.steps.filter((s) => !done.includes(s.id)).length }
  }
  if ((p = is('POST', '/sessions/:id/end'))) {
    const sess = db.sessions[p[0]]; if (!sess) throw notFound('Session')
    const { t } = findTask(sess.task_id)
    const secs = Math.round((Date.now() - sess.started) / 1000)
    const bonus = secs <= t.expected_seconds * 1.25 ? 10 : 5
    db.points += bonus
    if (db.lastStreakDay !== today()) { db.streak = db.lastStreakDay ? db.streak + 1 : 1; db.lastStreakDay = today(); db.bestStreak = Math.max(db.bestStreak, db.streak) }
    db.doneLog.push(new Date().toISOString()); delete db.sessions[p[0]]; save()
    return { duration_seconds: secs, expected_seconds: t.expected_seconds, bonus_points: bonus, total_points: db.points }
  }

  // AI + safety + progress (C and A own these on the real server)
  if (is('POST', '/praise')) {
    const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)].replace('{name}', b.child_name ?? 'friend')
    return { message: msg, source: 'template' }
  }
  if (is('GET', '/safety/resources')) {
    return { message: 'It sounds like today is hard. Please talk to a trusted adult.', resources: [{ name: 'Example helpline', contact: 'set in config' }] }
  }
  if (is('GET', '/progress/summary')) {
    const day = today(); const weekAgo = Date.now() - 7 * 864e5
    return {
      total_points: db.points, current_streak: db.streak, best_streak: db.bestStreak,
      tasks_completed_today: db.doneLog.filter((d) => d.slice(0, 10) === day).length,
      tasks_completed_week: db.doneLog.filter((d) => new Date(d).getTime() > weekAgo).length,
    }
  }

  throw new ApiError(404, `Mock has no route for ${method} ${path}`)
}
