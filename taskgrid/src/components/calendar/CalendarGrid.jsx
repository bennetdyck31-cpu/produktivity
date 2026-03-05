import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarDay } from './CalendarDay'

export function CalendarGrid({ tasks, onDaySelect, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [expandedDay, setExpandedDay] = useState(null)
  const today = useMemo(() => new Date(), [])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped = {}
    tasks.forEach(task => {
      const date = new Date(task.deadline)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(task)
    })
    return grouped
  }, [tasks])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // German week starts on Monday (1), Sunday is 0
    let startDayOfWeek = firstDay.getDay()
    if (startDayOfWeek === 0) startDayOfWeek = 7 // Sunday becomes 7

    const daysInMonth = lastDay.getDate()
    const days = []

    // Empty cells before first day
    for (let i = 1; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const key = `${year}-${month}-${day}`
      days.push({
        day,
        date,
        key,
        tasks: tasksByDate[key] || [],
        isToday: today.getDate() === day &&
                 today.getMonth() === month &&
                 today.getFullYear() === year,
        isSelected: selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year
      })
    }

    return days
  }, [currentMonth, tasksByDate, today, selectedDate])

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  const monthName = currentMonth.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric'
  })

  // Stats for header
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const overdueTasks = tasks.filter(t => {
    if (t.completed) return false
    return new Date(t.deadline) < today
  }).length

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setExpandedDay(null)
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setExpandedDay(null)
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    setExpandedDay(null)
    if (onDaySelect) onDaySelect(new Date())
  }

  const handleDayExpand = (dayInfo) => {
    setExpandedDay(expandedDay?.key === dayInfo.key ? null : dayInfo)
  }

  const handleDayCollapse = () => {
    setExpandedDay(null)
  }

  return (
    <div className="calendar-wrapper">
      {/* Header with month navigation */}
      <div className="calendar-header-controls">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
            {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {completedTasks} von {totalTasks} erledigt
            {overdueTasks > 0 && (
              <span style={{ color: 'var(--task-urgent)', marginLeft: '8px' }}>
                • {overdueTasks} überfällig
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={goToPrevMonth} title="Vorheriger Monat">
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToToday}>Heute</button>
          <button onClick={goToNextMonth} title="Nächster Monat">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {calendarDays.map((dayInfo, index) => {
          if (!dayInfo) {
            return <div key={`empty-${index}`} className="day-cell other-month" />
          }

          return (
            <CalendarDay
              key={dayInfo.key}
              dayInfo={dayInfo}
              isExpanded={expandedDay?.key === dayInfo.key}
              onExpand={() => handleDayExpand(dayInfo)}
              onCollapse={handleDayCollapse}
            />
          )
        })}
      </div>
    </div>
  )
}