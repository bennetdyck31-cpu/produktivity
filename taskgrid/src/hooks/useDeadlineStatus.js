import { useState, useEffect, useMemo } from 'react'

/**
 * Calculates deadline status and countdown for a task
 * @param {string|Date} deadline - The deadline date
 * @param {boolean} completed - Whether the task is completed
 * @returns {Object} Status information
 */
export function useDeadlineStatus(deadline, completed = false) {
  const [now, setNow] = useState(() => new Date())

  // Update every minute - nur wenn nötig
  useEffect(() => {
    // Wenn Task erledigt ist, brauchen wir kein Intervall
    if (completed) {
      setNow(new Date())
      return
    }

    const deadlineDate = new Date(deadline)
    const diffMs = deadlineDate - new Date()

    // Wenn Deadline mehr als 7 Tage entfernt, aktualisiere nur alle 60 Minuten
    // oder wenn sich der Tag ändert
    const intervalMs = diffMs > 7 * 24 * 60 * 60 * 1000 ? 60 * 60 * 1000 : 60000

    const interval = setInterval(() => {
      setNow(new Date())
    }, intervalMs)

    return () => clearInterval(interval)
  }, [deadline, completed])

  const status = useMemo(() => {
    if (!deadline) {
      return {
        status: 'unknown',
        label: 'Kein Datum',
        className: 'far',
        isOverdue: false,
        isUrgent: false,
        isSoon: false,
        countdown: null
      }
    }

    const deadlineDate = new Date(deadline)
    const diffMs = deadlineDate - now
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    // Completed tasks
    if (completed) {
      return {
        status: 'completed',
        label: 'Erledigt',
        className: 'completed',
        isOverdue: false,
        isUrgent: false,
        isSoon: false,
        countdown: null
      }
    }

    // Overdue
    if (diffMs < 0) {
      const hoursOverdue = Math.abs(diffHours)
      const daysOverdue = Math.abs(diffDays)
      return {
        status: 'overdue',
        label: daysOverdue >= 1
          ? `${daysOverdue} Tage überfällig`
          : `${hoursOverdue} Std. überfällig`,
        className: 'overdue',
        isOverdue: true,
        isUrgent: true,
        isSoon: false,
        countdown: diffMs
      }
    }

    // Urgent (< 2 days)
    if (diffDays < 2) {
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60))
      const minutesLeft = Math.floor(diffMs / (1000 * 60))
      if (hoursLeft < 1) {
        return {
          status: 'urgent',
          label: `${minutesLeft} Minuten!`,
          className: 'urgent',
          isOverdue: false,
          isUrgent: true,
          isSoon: true,
          countdown: diffMs
        }
      }
      return {
        status: 'urgent',
        label: diffDays === 0
          ? 'Heute!'
          : 'Morgen!',
        className: 'urgent',
        isOverdue: false,
        isUrgent: true,
        isSoon: true,
        countdown: diffMs
      }
    }

    // Soon (2-7 days)
    if (diffDays <= 7) {
      return {
        status: 'soon',
        label: `in ${diffDays} Tagen`,
        className: 'soon',
        isOverdue: false,
        isUrgent: false,
        isSoon: true,
        countdown: diffMs
      }
    }

    // Far away (> 7 days)
    return {
      status: 'far',
      label: `in ${diffDays} Tagen`,
      className: 'far',
      isOverdue: false,
      isUrgent: false,
      isSoon: false,
      countdown: diffMs
    }
  }, [deadline, completed, now])

  return status
}

/**
 * Hook to get formatted date string
 */
export function useFormattedDate(date) {
  return useMemo(() => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [date])
}

/**
 * Hook to get formatted time string
 */
export function useFormattedTime(date) {
  return useMemo(() => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [date])
}
