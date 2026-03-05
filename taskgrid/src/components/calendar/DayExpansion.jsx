import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { TaskModal } from '../tasks/TaskModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useDeadlineStatus } from '../../hooks/useDeadlineStatus'

export function DayExpansion({ dayInfo, stats, onClose }) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, task: null })

  const formattedDate = dayInfo.date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const uncompletedTasks = dayInfo.tasks.filter(t => !t.completed)
  const completedTasks = dayInfo.tasks.filter(t => t.completed)

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    // This would call the parent's onAddTask handler
    // For now, we'll just clear the input
    console.log('Add task:', newTaskTitle, 'for date:', dayInfo.date)
    setNewTaskTitle('')
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleDeleteTask = (task) => {
    setDeleteConfirm({ isOpen: true, task })
  }

  const confirmDelete = () => {
    console.log('Delete task:', deleteConfirm.task?.id)
    setDeleteConfirm({ isOpen: false, task: null })
  }

  const handleToggleComplete = (task) => {
    console.log('Toggle complete:', task.id, !task.completed)
  }

  return (
    <div className="day-expansion-overlay" onClick={onClose}>
      <div className="day-expansion" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="day-expansion-header">
          <div className="day-expansion-title">
            <h3>{formattedDate}</h3>
            <span className="task-summary">
              {stats.open} offen, {stats.completed} erledigt
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Quick add task */}
        <form className="quick-add-form" onSubmit={handleAddTask}>
          <Plus size={18} className="quick-add-icon" />
          <input
            type="text"
            placeholder="Neue Aufgabe hinzufügen..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            className="quick-add-input"
          />
          <button type="submit" className="quick-add-btn" disabled={!newTaskTitle.trim()}>
            Hinzufügen
          </button>
        </form>

        {/* Task lists */}
        <div className="day-expansion-content">
          {/* Uncompleted tasks */}
          {uncompletedTasks.length > 0 && (
            <div className="task-section">
              <h4 className="task-section-title">Offene Aufgaben</h4>
              <ul className="task-list">
                {uncompletedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="task-section completed-section">
              <h4 className="task-section-title">Erledigt</h4>
              <ul className="task-list">
                {completedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleComplete(task)}
                    onEdit={() => handleEditTask(task)}
                    onDelete={() => handleDeleteTask(task)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Empty state */}
          {dayInfo.tasks.length === 0 && (
            <div className="empty-day-state">
              <p>Keine Aufgaben für diesen Tag</p>
              <p className="hint">Füge eine Aufgabe über das Feld oben hinzu</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTask(null)
          }}
          onSave={(taskData, taskId) => {
            console.log('Save task:', taskId, taskData)
            setIsModalOpen(false)
            setEditingTask(null)
          }}
          editTask={editingTask}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, task: null })}
        onConfirm={confirmDelete}
        title="Aufgabe löschen?"
        message={`Möchtest du "${deleteConfirm.task?.title}" wirklich löschen?`}
      />
    </div>
  )
}

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [isHovered, setIsHovered] = useState(false)
  const deadlineStatus = useDeadlineStatus(task.deadline, task.completed)

  // Calculate urgency color based on task age
  const urgencyColor = getTaskUrgencyColor(task)

  return (
    <li
      className={`task-item ${task.completed ? 'completed' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Urgency indicator dot */}
      <span
        className="urgency-dot"
        style={{ backgroundColor: task.completed ? 'var(--success)' : urgencyColor }}
      />

      {/* Checkbox */}
      <button
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={onToggle}
        title={task.completed ? 'Als offen markieren' : 'Als erledigt markieren'}
      >
        {task.completed && <Check size={14} />}
      </button>

      {/* Task content */}
      <div className="task-content">
        <span className="task-title">{task.title}</span>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
        <div className="task-meta">
          <span className={`task-category ${task.category.toLowerCase()}`}>
            {task.category}
          </span>
          <span className={`task-priority ${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      {isHovered && !task.completed && (
        <div className="task-actions">
          <button className="action-btn edit" onClick={onEdit} title="Bearbeiten">
            <Pencil size={16} />
          </button>
          <button className="action-btn delete" onClick={onDelete} title="Löschen">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </li>
  )
}

function getTaskUrgencyColor(task) {
  if (task.completed) return 'var(--success)'

  const now = new Date()
  const deadline = new Date(task.deadline)
  const createdAt = new Date(task.created_at)

  const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24)
  const age = (now - createdAt) / (1000 * 60 * 60 * 24)

  // Overdue = red
  if (daysUntilDeadline < 0) return '#f43f5e'

  // Due today or tomorrow = orange/red
  if (daysUntilDeadline < 2) {
    if (daysUntilDeadline < 0.5) return '#f43f5e' // red
    return '#f59e0b' // orange
  }

  // Due within a week = yellow
  if (daysUntilDeadline < 7) {
    // Age factor: older tasks are more urgent
    if (age > 3) return '#f59e0b'
    return '#eab308'
  }

  // Far future = green/yellow based on age
  if (age > 5) return '#f59e0b'
  return '#10b981' // green
}