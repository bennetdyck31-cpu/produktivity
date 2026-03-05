import { useDeadlineStatus } from '../../hooks/useDeadlineStatus'

export function DeadlineChip({ deadline, completed }) {
  const status = useDeadlineStatus(deadline, completed)

  return (
    <span className={`deadline-chip ${status.className}`}>
      {status.label}
    </span>
  )
}
