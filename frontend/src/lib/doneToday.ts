// The contract has no "done today" flag per task, so the UI remembers it locally (per day).
const key = () => `bloomai-done-${new Date().toISOString().slice(0, 10)}`
export function getDoneToday(): number[] {
  try { return JSON.parse(localStorage.getItem(key()) ?? '[]') } catch { return [] }
}
export function markDoneToday(taskId: number) {
  try { const s = new Set(getDoneToday()); s.add(taskId); localStorage.setItem(key(), JSON.stringify([...s])) } catch { /* ignore */ }
}
/** Clear today's completed-task list (e.g. after a reset or for a fresh start). */
export function clearDoneToday() {
  try { localStorage.removeItem(key()) } catch { /* ignore */ }
}
