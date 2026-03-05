import { useState } from 'react'
import { Check, Trash2, Pencil } from 'lucide-react'

// Returns the background color based on days until the target date
function getUrgencyColor(targetDate, completed) {
    if (completed) return 'var(--task-done)'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tDate = new Date(targetDate)
    tDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((tDate - today) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'var(--task-urgent)'
    if (diffDays <= 2) return 'var(--task-soon)'
    return 'var(--task-planned)'
}

export function TaskItem({ task, targetDate, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)

    const handleEditSubmit = (e) => {
        e.preventDefault()
        const trimmed = editTitle.trim()
        if (trimmed && trimmed !== task.title) {
            onUpdate({ title: trimmed })
        }
        setIsEditing(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setEditTitle(task.title)
            setIsEditing(false)
        }
    }

    const bgColor = getUrgencyColor(targetDate, task.completed)

    if (isEditing) {
        return (
            <form
                onSubmit={handleEditSubmit}
                style={{ display: 'flex', gap: '4px', width: '100%' }}
                onClick={e => e.stopPropagation()}
            >
                <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={handleEditSubmit}
                    onKeyDown={handleKeyDown}
                    style={{ flex: 1, fontSize: '0.8rem', padding: '3px 6px', borderRadius: 4 }}
                />
            </form>
        )
    }

    return (
        <div
            className={`task-item ${task.completed ? 'completed' : ''}`}
            style={{ backgroundColor: bgColor }}
            onClick={e => e.stopPropagation()}
        >
            <span className="task-title-text">{task.title}</span>

            <div className="task-actions">
                {/* Toggle complete */}
                <button
                    title={task.completed ? 'Wieder öffnen' : 'Abhaken'}
                    onClick={e => { e.stopPropagation(); onUpdate({ completed: !task.completed }) }}
                >
                    <Check size={13} />
                </button>

                {/* Edit */}
                <button
                    title="Bearbeiten"
                    onClick={e => { e.stopPropagation(); setIsEditing(true) }}
                >
                    <Pencil size={13} />
                </button>

                {/* Delete */}
                <button
                    title="Löschen"
                    onClick={e => { e.stopPropagation(); onDelete() }}
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    )
}
