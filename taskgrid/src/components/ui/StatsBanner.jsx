import { ClipboardList, CheckCircle, AlertCircle } from 'lucide-react'

export function StatsBanner({ stats }) {
  const { open, completed, overdue } = stats

  return (
    <div className="stats-banner">
      <div className="stats-card open">
        <ClipboardList size={24} color="var(--info)" />
        <div className="stats-number">{open}</div>
        <div className="stats-label">Offene Aufgaben</div>
      </div>

      <div className="stats-card completed">
        <CheckCircle size={24} color="var(--success)" />
        <div className="stats-number">{completed}</div>
        <div className="stats-label">Erledigt</div>
      </div>

      <div className="stats-card overdue">
        <AlertCircle size={24} color="var(--danger)" />
        <div className="stats-number">{overdue}</div>
        <div className="stats-label">Überfällig</div>
      </div>
    </div>
  )
}
