import { useMemo } from 'react'

/**
 * Calculate urgency level and color for a task based on deadline and creation date
 * Color gradient: Green (new/planned) -> Yellow (aging) -> Red (urgent/overdue)
 */
export function useTaskUrgency(task) {
  return useMemo(() => {
    if (!task) {
      return { color: 'var(--text-muted)', urgencyLevel: 'unknown', progress: 0 }
    }

    if (task.completed) {
      return { color: 'var(--success)', urgencyLevel: 'completed', progress: 0 }
    }

    const now = new Date()
    const deadline = new Date(task.deadline)
    const createdAt = new Date(task.created_at)

    // Calculate time differences in days
    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntilDeadline = (deadline - now) / msPerDay
    const taskAge = (now - createdAt) / msPerDay

    // Overdue
    if (daysUntilDeadline < 0) {
      return {
        color: '#f43f5e', // red
        urgencyLevel: 'overdue',
        progress: 1
      }
    }

    // Due today
    if (daysUntilDeadline < 1) {
      return {
        color: '#f43f5e', // red
        urgencyLevel: 'urgent',
        progress: 0.9
      }
    }

    // Due tomorrow
    if (daysUntilDeadline < 2) {
      return {
        color: '#f97316', // orange
        urgencyLevel: 'very-soon',
        progress: 0.75
      }
    }

    // Due within a week
    if (daysUntilDeadline < 7) {
      // Age affects urgency within this range
      const ageFactor = Math.min(taskAge / 7, 1)
      const baseProgress = 0.5 + (7 - daysUntilDeadline) / 14
      const progress = Math.min(baseProgress + ageFactor * 0.25, 0.75)

      return {
        color: progress > 0.65 ? '#f59e0b' : '#eab308', // amber/yellow
        urgencyLevel: 'soon',
        progress
      }
    }

    // Due within a month
    if (daysUntilDeadline < 30) {
      const ageFactor = Math.min(taskAge / 14, 1)
      const progress = 0.25 + ageFactor * 0.25

      return {
        color: progress > 0.4 ? '#eab308' : '#84cc16', // lime/yellow
        urgencyLevel: 'upcoming',
        progress
      }
    }

    // Far future - green/yellow based on age
    const ageFactor = Math.min(taskAge / 30, 1)
    const progress = ageFactor * 0.25

    return {
      color: ageFactor > 0.5 ? '#84cc16' : '#10b981', // lime/green
      urgencyLevel: 'planned',
      progress
    }
  }, [task])
}

/**
 * Get urgency color for a simple date calculation (used for day cells)
 */
export function getUrgencyColorForDate(tasks) {
  if (!tasks || tasks.length === 0) return 'var(--border)'

  const uncompleted = tasks.filter(t => !t.completed)
  if (uncompleted.length === 0) return 'var(--success)'

  const now = new Date()
  let maxUrgency = 0

  uncompleted.forEach(task => {
    const deadline = new Date(task.deadline)
    const createdAt = new Date(task.created_at)
    const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24)
    const age = (now - createdAt) / (1000 * 60 * 60 * 24)

    // Calculate urgency factor (0-1)
    let urgency = 0

    if (daysUntilDeadline < 0) {
      urgency = 1 // Overdue
    } else if (daysUntilDeadline < 1) {
      urgency = 0.95 // Due today
    } else if (daysUntilDeadline < 3) {
      urgency = 0.7 + Math.min(age / 14, 0.25) // Very soon
    } else if (daysUntilDeadline < 7) {
      urgency = 0.5 + Math.min(age / 14, 0.2) // This week
    } else if (daysUntilDeadline < 14) {
      urgency = 0.3 + Math.min(age / 21, 0.15) // Next two weeks
    } else {
      urgency = Math.min(age / 30, 0.3) // Far future
    }

    if (urgency > maxUrgency) maxUrgency = urgency
  })

  // Map urgency to color
  if (maxUrgency >= 0.9) return '#f43f5e' // red
  if (maxUrgency >= 0.7) return '#f97316' // orange
  if (maxUrgency >= 0.5) return '#f59e0b' // amber
  if (maxUrgency >= 0.3) return '#eab308' // yellow
  if (maxUrgency >= 0.15) return '#84cc16' // lime
  return '#10b981' // green
}

/**
 * Get urgency gradient stops for visualizations
 */
export function getUrgencyGradient(createdAt, deadline) {
  const now = new Date()
  const start = new Date(createdAt)
  const end = new Date(deadline)

  const totalDays = (end - start) / (1000 * 60 * 60 * 24)
  const elapsed = (now - start) / (1000 * 60 * 60 * 24)
  const progress = Math.max(0, Math.min(1, elapsed / totalDays))

  // Gradient stops
  return {
    startColor: '#10b981', // green
    midColor: '#f59e0b',   // amber
    endColor: '#f43f5e',   // red
    currentColor: interpolateColor('#10b981', '#f43f5e', progress),
    progress
  }
}

function interpolateColor(color1, color2, factor) {
  // Simple hex color interpolation
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)

  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)

  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}