import { useMemo } from 'react'

/**
 * useTaskStats — berechnet Statistiken aus der Task-Liste.
 * Wird in App.jsx verwendet. Kein Netzwerkaufruf nötig.
 */
export function useTaskStats(tasks) {
  return useMemo(() => {
    const now = new Date()
    return tasks.reduce((stats, task) => {
      if (task.completed) {
        stats.completed++
      } else {
        stats.open++
        if (new Date(task.deadline) < now) {
          stats.overdue++
        }
      }
      return stats
    }, { open: 0, completed: 0, overdue: 0 })
  }, [tasks])
}

// ============================================================
// TODO Phase 3: Docker-Backend anbinden
// Wenn der Express-Server läuft (docker-compose up), diese
// Funktionen mit fetch() aufrufen statt lokalen State zu nutzen.
//
// GET    http://localhost:3001/api/tasks
// POST   http://localhost:3001/api/tasks
// PATCH  http://localhost:3001/api/tasks/:id
// DELETE http://localhost:3001/api/tasks/:id
// ============================================================
