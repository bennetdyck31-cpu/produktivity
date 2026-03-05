import { useState } from 'react'
import { X, Plus, Check, Pencil, Trash2 } from 'lucide-react'
import { PieChart } from './PieChart'

export function CalendarDay({ dayInfo, isExpanded, onExpand, onCollapse }) {
  const [newTaskTitle, setNewTaskTitle] = useState('')

  if (dayInfo.isOtherMonth) {
    return <div className="day-cell other-month" />
  }

  const { day, date, tasks, isToday } = dayInfo

  // Calculate stats
  const completed = tasks.filter(t => t.completed).length
  const total = tasks.length
  const open = total - completed

  // Get urgency color for each task
  const getTaskUrgencyColor = (task) => {
    if (task.completed) return 'var(--task-done)'

    const now = new Date()
    const deadline = new Date(task.deadline)
    const created = new Date(task.created_at)
    const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24)
    const age = (now - created) / (1000 * 60 * 60 * 24)

    // Overdue = urgent (red)
    if (daysUntilDeadline < 0) return 'var(--task-urgent)'

    // Due today or tomorrow
    if (daysUntilDeadline < 2) return 'var(--task-urgent)'

    // Due within a week - color based on age
    if (daysUntilDeadline < 7) {
      if (age > 3) return 'var(--task-soon)'
      return 'var(--task-soon)'
    }

    // Far future - green (planned)
    if (age > 7) return 'var(--task-soon)'
    return 'var(--task-planned)'
  }

  const handleTaskToggle = (taskId) => {
    console.log('Toggle task:', taskId)
    // Will be connected to parent state
  }

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    console.log('Add task:', newTaskTitle, 'for date:', date)
    setNewTaskTitle('')
  }

  const dayName = date?.toLocaleDateString('de-DE', { weekday: 'long' }) || ''
  const formattedDate = date?.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) || ''

  return (
    <div
      className={`day-cell ${isExpanded ? 'expanded' : ''}`}
      onClick={!isExpanded ? onExpand : undefined}
    >
      {/* Day header */}
      <div className="day-header">
        <span style={{
          fontWeight: isToday ? '700' : '500',
          color: isToday ? 'var(--accent-green)' : 'inherit',
          background: isToday ? 'rgba(74, 93, 35, 0.1)' : 'transparent',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {day}
        </span>
        {!isExpanded && total > 0 && (
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            {open}/{total}
          </span>
        )}
        {isExpanded && (
          <button
            className="close-expanded"
            onClick={(e) => { e.stopPropagation(); onCollapse() }}
            style={{ marginLeft: 'auto' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Compact view (not expanded) */}
      {!isExpanded && (
        <>
          {total > 0 && (
            <div className="pie-chart-container">
              <PieChart completed={completed} total={total} size={50} />
            </div>
          )}
          {/* Task preview dots */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: 'auto' }}>
            {tasks.slice(0, 4).map((task, idx) => (
              <div
                key={task.id || idx}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getTaskUrgencyColor(task),
                  opacity: task.completed ? 0.5 : 1
                }}
                title={task.title}
              />
            ))}
            {tasks.length > 4 && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                +{tasks.length - 4}
              </span>
            )}
          </div>
        </>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="expanded-content" onClick={e => e.stopPropagation()}>
          {/* Task list */}
          <div className="task-list">
            {tasks.map((task, idx) => (
              <div
                key={task.id || idx}
                className={`task-item ${task.completed ? 'completed' : ''}`}
                style={{ background: getTaskUrgencyColor(task) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <button
                    onClick={() => handleTaskToggle(task.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: '2px solid white',
                      background: task.completed ? 'white' : 'transparent',
                      color: task.completed ? 'var(--task-done)' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    {task.completed && <Check size={12} />}
                  </button>
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {task.title}
                  </span>
                </div>
                <div className="task-actions">
                  <button title="Bearbeiten"><Pencil size={14} /></button>
                  <button title="Löschen"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new task */}
          <form className="task-input-wrapper" onSubmit={handleAddTask}>
            <input
              type="text"
              placeholder="Neue Aufgabe..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
            />
            <button type="submit" disabled={!newTaskTitle.trim()}>
              <Plus size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}