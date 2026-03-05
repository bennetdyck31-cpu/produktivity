import { useState, useMemo, useCallback } from 'react'

export function useCalendar(tasks = []) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [expandedDate, setExpandedDate] = useState(null)

  // Aktueller Monat und Jahr
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const today = new Date()

  // Tagesnamen (Excel-Stil: Mo-So)
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  // Monatsnamen
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]

  // Kalender-Daten generieren
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()

    // Erster Tag der Woche (0 = So, 1 = Mo, ...)
    let firstDayOfWeek = firstDayOfMonth.getDay()
    // Konvertiere zu Mo-So (Mo = 0, So = 6)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const days = []

    // Leere Zellen für Tage vor dem ersten Tag
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ type: 'empty', index: i })
    }

    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateStr = date.toISOString().split('T')[0]

      // Tasks für diesen Tag filtern
      const dayTasks = tasks.filter(task => {
        if (!task.deadline) return false
        const taskDate = new Date(task.deadline)
        return taskDate.getDate() === day &&
               taskDate.getMonth() === currentMonth &&
               taskDate.getFullYear() === currentYear
      })

      // Berechne Farbverlauf basierend auf überfälligkeit
      const hasOverdue = dayTasks.some(t => {
        if (t.completed) return false
        const taskDate = new Date(t.deadline)
        return taskDate < today && taskDate.getDate() !== today.getDate()
      })

      const isToday = day === today.getDate() &&
                      currentMonth === today.getMonth() &&
                      currentYear === today.getFullYear()

      days.push({
        type: 'day',
        day,
        date,
        dateStr,
        tasks: dayTasks,
        hasOverdue,
        isToday,
        isExpanded: expandedDate === dateStr,
        isSelected: selectedDate === dateStr
      })
    }

    return days
  }, [currentMonth, currentYear, tasks, expandedDate, selectedDate, today])

  // Navigation
  const goToPrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setExpandedDate(null)
  }, [currentMonth, currentYear])

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setExpandedDate(null)
  }, [currentMonth, currentYear])

  const goToToday = useCallback(() => {
    const now = new Date()
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(now.toISOString().split('T')[0])
  }, [])

  const toggleExpand = useCallback((dateStr) => {
    setExpandedDate(prev => prev === dateStr ? null : dateStr)
    setSelectedDate(dateStr)
  }, [])

  const selectDate = useCallback((dateStr) => {
    setSelectedDate(dateStr)
  }, [])

  // Statistiken für den Monat
  const monthStats = useMemo(() => {
    const monthTasks = tasks.filter(task => {
      if (!task.deadline) return false
      const taskDate = new Date(task.deadline)
      return taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear
    })

    const total = monthTasks.length
    const completed = monthTasks.filter(t => t.completed).length
    const overdue = monthTasks.filter(t => {
      if (t.completed) return false
      const taskDate = new Date(t.deadline)
      return taskDate < today && taskDate.getDate() !== today.getDate()
    }).length

    return { total, completed, overdue, open: total - completed }
  }, [tasks, currentMonth, currentYear, today])

  return {
    // State
    currentDate,
    currentMonth,
    currentYear,
    monthName: monthNames[currentMonth],
    weekDays,
    calendarDays,
    selectedDate,
    expandedDate,
    today,

    // Stats
    monthStats,

    // Actions
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    toggleExpand,
    selectDate
  }
}

// Berechne Farbverlauf für überfällige Tasks (grün -> gelb -> rot)
export function getUrgencyColor(task, today = new Date()) {
  if (task.completed) return { bg: '#10b981', text: '#fff' }

  const deadline = new Date(task.deadline)
  const now = new Date(today)
  now.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((deadline - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    // Überfällig - Rot
    return { bg: '#f43f5e', text: '#fff', urgency: 'overdue' }
  } else if (diffDays === 0) {
    // Heute - Orange/Rot
    return { bg: '#f59e0b', text: '#fff', urgency: 'today' }
  } else if (diffDays === 1) {
    // Morgen - Gelb/Orange
    return { bg: '#fbbf24', text: '#000', urgency: 'tomorrow' }
  } else if (diffDays <= 3) {
    // In 2-3 Tagen - Hellgelb
    return { bg: '#fde047', text: '#000', urgency: 'soon' }
  } else {
    // Weit weg - Grün
    return { bg: '#10b981', text: '#fff', urgency: 'planned' }
  }
}

// Berechne Farbverlauf basierend auf Tagen seit Deadline
export function getOverdueGradient(task, today = new Date()) {
  if (task.completed) return 'var(--success)'

  const deadline = new Date(task.deadline)
  const now = new Date(today)
  deadline.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24))

  if (daysOverdue <= 0) return null // Nicht überfällig

  // Farbverlauf von Grün über Gelb nach Rot basierend auf Überfälligkeit
  if (daysOverdue === 1) return '#22c55e' // Grün (gerade überfällig)
  if (daysOverdue === 2) return '#84cc16' // Gelb-Grün
  if (daysOverdue === 3) return '#eab308' // Gelb
  if (daysOverdue === 4) return '#f59e0b' // Orange
  if (daysOverdue === 5) return '#f97316' // Dunkelorange
  return '#f43f5e' // Rot (sehr überfällig)
}
