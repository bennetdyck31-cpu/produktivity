import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Sidebar({ tasks, onDayClick, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  // Memoisierte Berechnungen
  const today = useMemo(() => new Date(), [])

  const isCurrentMonth = useMemo(() =>
    today.getMonth() === currentMonth.getMonth() &&
    today.getFullYear() === currentMonth.getFullYear()
  , [today, currentMonth])

  // Get deadlines for current month
  const deadlinesInMonth = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .map(t => new Date(t.deadline).getDate())
  }, [tasks])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay() || 7 // Convert Sunday from 0 to 7
    const daysInMonth = lastDay.getDate()

    const days = []

    // Empty cells for days before first day of month
    for (let i = 1; i < startDay; i++) {
      days.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isToday: isCurrentMonth && day === today.getDate(),
        hasDeadline: deadlinesInMonth.includes(day)
      })
    }

    return days
  }, [currentMonth, deadlinesInMonth, isCurrentMonth, today])

  // Memoisierte Callbacks
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }, [currentMonth])

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date())
  }, [])

  const handleDayClick = useCallback((day) => {
    if (onDayClick) {
      // Erstelle ein Date-Objekt für den geklickten Tag
      const clickedDate = day ? new Date(currentYear, currentMonth, day) : null
      const currentSelected = selectedDate ? selectedDate.getDate() : null
      onDayClick(day === currentSelected ? null : clickedDate)
    }
  }, [onDayClick, selectedDate, currentMonth, currentYear])

  // Memoisierte Werte
  const weekDays = useMemo(() => ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], [])

  const monthName = useMemo(() => {
    const name = currentMonth.toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric'
    })
    return name.charAt(0).toUpperCase() + name.slice(1)
  }, [currentMonth])

  // Memoisierte Styles
  const headerStyle = useMemo(() => ({
    fontSize: '1rem',
    fontWeight: '600'
  }), [])

  const buttonContainerStyle = useMemo(() => ({
    display: 'flex',
    gap: 'var(--spacing-xs)'
  }), [])

  const prevNextButtonStyle = useMemo(() => ({
    padding: '4px'
  }), [])

  const todayButtonStyle = useMemo(() => ({
    padding: '4px 8px',
    fontSize: '0.75rem'
  }), [])

  const upcomingHeaderStyle = useMemo(() => ({
    fontSize: '0.875rem',
    marginBottom: 'var(--spacing-sm)',
    color: 'var(--text-secondary)'
  }), [])

  const deadlinesContainerStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)'
  }), [])

  // Memoisierte anstehende Deadlines
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
  }, [tasks])

  const hasNoTasks = useMemo(() =>
    tasks.filter(t => !t.completed).length === 0
  , [tasks])

  return (
    <aside className="calendar-sidebar">
      <div className="calendar-header">
        <h3 style={headerStyle}>
          {monthName}
        </h3>
        <div style={buttonContainerStyle}>
          <button
            className="navbar-icon-btn"
            onClick={goToPrevMonth}
            style={prevNextButtonStyle}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="navbar-icon-btn"
            onClick={goToToday}
            style={todayButtonStyle}
          >
            Heute
          </button>
          <button
            className="navbar-icon-btn"
            onClick={goToNextMonth}
            style={prevNextButtonStyle}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {calendarDays.map((item, index) => {
          if (!item) {
            return <div key={`empty-${index}`} />
          }

          const isSelected = selectedDate !== null && selectedDate.getDate() === item.day
          const dayClassName = [
            'calendar-day',
            item.isToday ? 'today' : '',
            item.hasDeadline ? 'has-deadline' : '',
            isSelected ? 'selected' : ''
          ].filter(Boolean).join(' ')

          return (
            <div
              key={item.day}
              className={dayClassName}
              style={{ cursor: 'pointer' }}
              onClick={() => handleDayClick(item.day)}
            >
              {item.day}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <h4 style={upcomingHeaderStyle}>
          Anstehende Deadlines
        </h4>
        <div style={deadlinesContainerStyle}>
          {upcomingDeadlines.map(task => {
            const isOverdue = new Date(task.deadline) < new Date()
            const deadlineFormatted = new Date(task.deadline).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })

            const taskStyle = {
              fontSize: '0.75rem',
              padding: 'var(--spacing-xs)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `2px solid ${isOverdue ? 'var(--danger)' : 'var(--accent)'}`
            }

            const titleStyle = {
              color: 'var(--text-primary)',
              fontWeight: '500'
            }

            const dateStyle = {
              color: 'var(--text-muted)',
              fontSize: '0.625rem',
              marginTop: '2px'
            }

            return (
              <div
                key={task.id}
                style={taskStyle}
              >
                <span style={titleStyle}>
                  {task.title}
                </span>
                <div style={dateStyle}>
                  {deadlineFormatted}
                </div>
              </div>
            )
          })}
          {hasNoTasks && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Keine anstehenden Aufgaben
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
