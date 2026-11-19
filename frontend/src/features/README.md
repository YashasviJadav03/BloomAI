# Member C features: check-in, audio, progress

Self-contained React + TypeScript features. Member B owns the app shell, routing and
theme; these folders only export components, hooks and API helpers to mount.

| Folder | Exports | Plan commits |
| :--- | :--- | :--- |
| `checkin/` | `CheckInFlow`, `EmojiPicker`, `TextCheckin`, `CalmReplyCard`, `fetchPraise`, `submitCheckin`, `fetchCalmReply` | C4, C5, C11, C14 |
| `audio/` | `AudioRecorder`, `useVoiceCheckin`, volume and pace helpers | C8, C9, C10 |
| `progress/` | `ProgressPage`, `MoodChart`, `weeklyNote`, `fillDays` | C12, C13 |

## Dependencies the app needs

```bash
npm i react react-dom recharts
```

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/dom
```

The components use Tailwind utility classes (B1's stack). The chart colours live in
`progress/progress.css`, using the validated light and dark palette.

## Wiring (for Member B)

```tsx
import { CheckInFlow, fetchPraise, DEFAULT_PRAISE } from "@/features/checkin";
import { ProgressPage } from "@/features/progress";

// Check-in route. The safe-mode decision comes from the backend (A's distress rule).
<CheckInFlow
  childName={profile.name}
  sessionId={session?.session_id ?? null}
  onSafeMode={() => navigate("/safe-mode")}            // B13 screen. Calm reply is NOT requested.
  onActivity={(activity) => navigate(`/calm-down?activity=${activity}`)} // B12 screen
  onDone={() => navigate(-1)}
/>

// Praise for the reward animation (B10), after POST /api/sessions/{id}/steps/{step_id}/complete:
const { message } = await fetchPraise({ event: "step_completed", child_name: profile.name, task_title, step_text, streak });
// fetchPraise never throws; on failure it returns DEFAULT_PRAISE.

// Progress route
<ProgressPage childName={profile.name} />
```

`suggested_activity` is one of `breathing | movement | stretching | talk_to_adult | none`.
`talk_to_adult` only comes back when the calm-reply's own distress check trips. Treat it
like safe mode (show the trusted-adult screen).

## Environment

| Variable | Default | Meaning |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend base URL |
| `VITE_USE_MOCK` | `false` | `true` answers from the contract examples, with no backend |

All HTTP goes through `checkin/http.ts`. When `src/api/client.ts` lands, point `request()` at it.

## Privacy notes

- Voice: no `MediaRecorder` and no audio buffers. Each frame becomes one level number; on
  stop the mic is closed and only `{avg_volume, peak_volume, words_per_minute, duration_seconds}` is sent.
- Pace uses the Web Speech API. In Chrome it may run on Google's servers. We request
  on-device recognition where supported. With no speech support, `words_per_minute` is `null`
  and the backend scores on volume only.
- The speech transcript is never sent unless the child taps **Use my words**, which copies it into the text box.
