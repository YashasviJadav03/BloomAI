// PLACEHOLDER owned by Member C ("My Progress": streak, points, mood by day, weekly note).
import { useNavigate } from 'react-router-dom'
import { PageShell } from '../../components/PageShell'
import { BigButton, EmptyState } from '../../components/ui'

export default function ProgressPage() {
  const nav = useNavigate()
  return (
    <PageShell title="My progress" back>
      <EmptyState icon="star" title="Progress page coming soon" hint="Member C builds this screen." action={<BigButton onClick={() => nav('/')}>Back home</BigButton>} />
    </PageShell>
  )
}
