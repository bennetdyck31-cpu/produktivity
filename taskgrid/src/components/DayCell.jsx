import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { TaskItem } from './TaskItem'
import { PieChart } from './PieChart'

// Determine a tinted background for the entire expanded card
function getCellTint(tasks) {
    if (!tasks.length) return undefined
    const open = tasks.filter(t => !t.completed)
    if (!open.length) return '#EEF5E7' // all done – soft green
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const hasCritical = open.some(t => {
        const d = new Date(t.deadline || t.created || Date.now())
        d.setHours(0, 0, 0, 0)
        return Math.round((d - today) / 86400000) <= 0
    })
    if (hasCritical) return '#FBF0F0' // urgent – soft red tint
    return '#FFFDF8' // neutral warm
}

export function DayCell({
    dateString, dateObj, dateScore, isExpanded, tasks,
    onClick, onClose, onTaskAdd, onTaskUpdate, onTaskDelete
}) {
    const [newTaskTitle, setNewTaskTitle] = useState('')

    const handleAddSubmit = (e) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return
        onTaskAdd(newTaskTitle.trim())
        setNewTaskTitle('')
    }

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length
    const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

    const visibleTasks = isExpanded ? tasks : tasks.slice(0, 2)
    const hiddenCount = tasks.length - visibleTasks.length

    const cardBg = isExpanded ? getCellTint(tasks) : undefined

    // Check if today
    const now = new Date()
    const isToday =
        dateObj && dateObj.getDate() === now.getDate() &&
        dateObj.getMonth() === now.getMonth() &&
        dateObj.getFullYear() === now.getFullYear()

    const cellClasses = [
        'day-cell',
        isExpanded ? 'expanded' : '',
        tasks.length ? 'has-tasks' : '',
        isToday ? 'today' : '',
    ].filter(Boolean).join(' ')

    return (
        <div
            className={cellClasses}
            style={cardBg ? { background: cardBg } : {}}
            onClick={!isExpanded ? onClick : undefined}
        >
            <div className="day-header">
                <span>{dateScore}.</span>
                {isExpanded && (
                    <button className="close-expanded" onClick={onClose} title="Schließen">
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="expanded-content">
                <div className="task-list">
                    {visibleTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            targetDate={dateObj}
                            onUpdate={updates => onTaskUpdate(task.id, updates)}
                            onDelete={() => onTaskDelete(task.id)}
                        />
                    ))}
                    {!isExpanded && hiddenCount > 0 && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 2 }}>
                            + {hiddenCount} mehr
                        </div>
                    )}
                </div>

                {isExpanded && (
                    <>
                        <form className="task-input-wrapper" onSubmit={handleAddSubmit} onClick={e => e.stopPropagation()}>
                            <input
                                type="text"
                                placeholder="Neue Aufgabe hinzufügen…"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                autoFocus
                            />
                            <button type="submit"><Plus size={16} /></button>
                        </form>

                        {totalTasks > 0 && (
                            <div className="pie-chart-container">
                                <PieChart percent={percent} />
                                <span className="pie-label">{completedTasks}/{totalTasks} erledigt</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
