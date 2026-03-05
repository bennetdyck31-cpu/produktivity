const priorityConfig = {
  'Hoch': { className: 'badge-priority-high', icon: '🔴' },
  'Mittel': { className: 'badge-priority-medium', icon: '🟡' },
  'Niedrig': { className: 'badge-priority-low', icon: '🟢' }
}

export function PriorityPill({ priority }) {
  const config = priorityConfig[priority] || priorityConfig['Mittel']

  return (
    <span className={`badge badge-priority ${config.className}`}>
      {config.icon} {priority}
    </span>
  )
}

export const priorities = ['Hoch', 'Mittel', 'Niedrig']
