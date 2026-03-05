import { useState, useCallback, useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { CategoryBadge } from '../ui/CategoryBadge'
import { PriorityPill } from '../ui/PriorityPill'
import { DeadlineChip } from './DeadlineChip'

const priorityColors = {
  'Hoch': 'var(--priority-high)',
  'Mittel': 'var(--priority-medium)',
  'Niedrig': 'var(--priority-low)'
}

export function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false)

  // Memoisierte Berechnungen
  const isOverdue = useMemo(() => {
    return !task.completed && new Date(task.deadline) < new Date()
  }, [task.completed, task.deadline])

  const borderColor = useMemo(() => {
    if (task.completed) return '3px solid var(--text-muted)'
    if (isOverdue) return '3px solid var(--danger)'
    return `3px solid ${priorityColors[task.priority] || 'var(--border)'}`
  }, [task.completed, isOverdue, task.priority])

  const deadlineFormatted = useMemo(() => {
    return new Date(task.deadline).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [task.deadline])

  const createdFormatted = useMemo(() => {
    return new Date(task.created_at).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [task.created_at])

  // Memoisierte Callbacks
  const handleToggle = useCallback(() => {
    onToggle(task.id, !task.completed)
  }, [onToggle, task.id, task.completed])

  const handleEdit = useCallback(() => {
    onEdit(task)
  }, [onEdit, task])

  const handleDelete = useCallback(() => {
    onDelete(task)
  }, [onDelete, task])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  // Memoisierte Styles
  const rowClassName = useMemo(() => {
    return [
      task.completed ? 'completed' : '',
      isOverdue ? 'overdue' : ''
    ].filter(Boolean).join(' ')
  }, [task.completed, isOverdue])

  const titleStyle = useMemo(() => ({
    fontWeight: task.completed ? '400' : '500',
    color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)'
  }), [task.completed])

  const descriptionStyle = useMemo(() => ({
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    maxWidth: '200px',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }), [])

  const deadlineContainerStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }), [])

  const deadlineTextStyle = useMemo(() => ({
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  }), [])

  const createdStyle = useMemo(() => ({
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  }), [])

  return (
    <tr
      className={rowClassName}
      style={{ borderLeft: borderColor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <td>
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
          />
        </div>
      </td>

      <td>
        <span style={titleStyle}>
          {task.title}
        </span>
      </td>

      <td>
        <span style={descriptionStyle}>
          {task.description || '-'}
        </span>
      </td>

      <td>
        <CategoryBadge category={task.category} />
      </td>

      <td>
        <PriorityPill priority={task.priority} />
      </td>

      <td>
        <div style={deadlineContainerStyle}>
          <span style={deadlineTextStyle}>
            {deadlineFormatted}
          </span>
          <DeadlineChip deadline={task.deadline} completed={task.completed} />
        </div>
      </td>

      <td>
        <span style={createdStyle}>
          {createdFormatted}
        </span>
      </td>

      <td>
        <span className={`badge badge-status ${task.completed ? 'completed' : 'open'}`}>
          {task.completed ? '✓ Fertig' : task.status}
        </span>
      </td>

      <td>
        <div className="action-icons">
          <button
            className="action-icon"
            onClick={handleEdit}
            title="Bearbeiten"
          >
            <Pencil size={16} />
          </button>
          <button
            className="action-icon delete"
            onClick={handleDelete}
            title="Löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
