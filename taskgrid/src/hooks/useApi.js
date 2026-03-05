import { useState, useCallback, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

export function useApi() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Alle Tasks laden
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/tasks`)
      if (!response.ok) throw new Error('Fehler beim Laden der Tasks')
      const data = await response.json()
      setTasks(data)
      return data
    } catch (err) {
      setError(err.message)
      console.error('API Error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial laden
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Task erstellen
  const createTask = useCallback(async (taskData) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      if (!response.ok) throw new Error('Fehler beim Erstellen des Tasks')
      const newTask = await response.json()
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Task aktualisieren
  const updateTask = useCallback(async (id, taskData) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Tasks')
      const updatedTask = await response.json()
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Task löschen
  const deleteTask = useCallback(async (id) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Fehler beim Löschen des Tasks')
      setTasks(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Task umschalten (completed)
  const toggleTask = useCallback(async (id, completed) => {
    return updateTask(id, { completed, status: completed ? 'Erledigt' : 'Offen' })
  }, [updateTask])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTask
  }
}
