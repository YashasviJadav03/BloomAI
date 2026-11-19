// PLACEHOLDER owned by Member C (check-in UI: emoji picker, text box, audio).
// B's session screen navigates here after a task: /checkin?session=<session_id>
// C: replace this file. Contract with B:
//   - if POST /api/checkins returns safe_mode === true -> navigate('/safe', { replace: true })
//   - otherwise call /api/calm-reply, show the message, and (optionally)
//     navigate('/calm?activity=<suggested_activity>', { state: { message } })
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { BigButton, EmptyState } from '../../components/ui'

export default function CheckInPage() {
  const nav = useNavigate()
  const [p] = useSearchParams()
  return (
    <PageShell title="How do you feel?" back>
      <EmptyState icon="face" title="Check-in coming soon" hint={`Member C builds this screen (session ${p.get('session') ?? 'none'}).`}
        action={<BigButton onClick={() => nav('/')}>Back home</BigButton>} />
    </PageShell>
  )
}
