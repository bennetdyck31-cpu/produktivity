import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ============================================
// CONSTANTS
// ============================================

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
}

const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100 // Maximum number of cached queries
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate retry delay with exponential backoff
 */
const getRetryDelay = (attempt) => {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelay
  )
  return delay + Math.random() * 1000 // Add jitter
}

/**
 * Check if an error is retryable
 */
const isRetryableError = (error) => {
  if (!error) return false
  const retryableCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'NETWORK_ERROR',
    '503',
    '504',
    '429',
    '500'
  ]
  return retryableCodes.some(code =>
    error.message?.includes(code) ||
    error.code === code ||
    error.statusCode?.toString() === code
  )
}

/**
 * Simple in-memory cache implementation
 */
class QueryCache {
  constructor() {
    this.cache = new Map()
    this.timestamps = new Map()
  }

  get(key) {
    if (!this.cache.has(key)) return null

    const timestamp = this.timestamps.get(key)
    if (Date.now() - timestamp > CACHE_CONFIG.ttl) {
      this.delete(key)
      return null
    }

    return this.cache.get(key)
  }

  set(key, value) {
    // Evict oldest entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.delete(firstKey)
    }

    this.cache.set(key, value)
    this.timestamps.set(key, Date.now())
  }

  delete(key) {
    this.cache.delete(key)
    this.timestamps.delete(key)
  }

  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key)
      }
    }
  }
}

const globalCache = new QueryCache()

// ============================================
// ENHANCED USETASKS HOOK
// ============================================

/**
 * Enhanced hook for task CRUD operations with:
 * - Retry logic for network errors
 * - Optimistic updates
 * - Caching
 * - Better error handling
 * - Request deduplication
 * - Real-time sync with conflict resolution
 */
export function useTasksEnhanced(options = {}) {
  const {
    enableCache = true,
    enableRealtime = true,
    retryAttempts = RETRY_CONFIG.maxRetries
  } = options

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Refs for managing concurrent requests and optimistic updates
  const abortControllerRef = useRef(new AbortController())
  const pendingOperationsRef = useRef(new Map())
  const optimisticUpdatesRef = useRef(new Map())
  const subscriptionRef = useRef(null)
  const fetchInProgressRef = useRef(false)

  // ============================================
  // NETWORK STATUS
  // ============================================

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ============================================
  // RETRY WRAPPER
  // ============================================

  const withRetry = useCallback(async (operation, operationName) => {
    let lastError

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (err) {
        lastError = err

        if (attempt === retryAttempts || !isRetryableError(err)) {
          throw err
        }

        console.warn(`[${operationName}] Attempt ${attempt + 1} failed, retrying...`, err)
        await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)))
      }
    }

    throw lastError
  }, [retryAttempts])

  // ============================================
  // FETCH TASKS
  // ============================================

  const fetchTasks = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping...')
      return
    }

    const cacheKey = 'tasks:all'

    // Check cache first
    if (enableCache && !forceRefresh) {
      const cached = globalCache.get(cacheKey)
      if (cached) {
        console.log('Using cached tasks')
        setTasks(cached)
        setLoading(false)
        return
      }
    }

    fetchInProgressRef.current = true
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .select('*')
          .order('deadline', { ascending: true })
      }, 'fetchTasks')

      if (fetchError) throw fetchError

      const tasksData = data || []

      // Apply any pending optimistic updates
      const mergedTasks = tasksData.map(task => {
        const optimistic = optimisticUpdatesRef.current.get(task.id)
        return optimistic ? { ...task, ...optimistic } : task
      })

      setTasks(mergedTasks)

      // Update cache
      if (enableCache) {
        globalCache.set(cacheKey, mergedTasks)
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError({
        message: err.message || 'Failed to fetch tasks',
        code: err.code,
        status: err.status,
        recoverable: isRetryableError(err)
      })
    } finally {
      setLoading(false)
      fetchInProgressRef.current = false
    }
  }, [enableCache, withRetry])

  // ============================================
  // CREATE TASK
  // ============================================

  const createTask = useCallback(async (taskData) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Optimistic update
    const optimisticTask = {
      id: tempId,
      ...taskData,
      completed: false,
      status: taskData.status || 'Offen',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _optimistic: true
    }

    setTasks(prev => [...prev, optimisticTask])
    optimisticUpdatesRef.current.set(tempId, optimisticTask)

    try {
      const { data, error: createError } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .insert([{
            ...taskData,
            completed: false,
            status: taskData.status || 'Offen'
          }])
          .select()
          .single()
      }, 'createTask')

      if (createError) throw createError

      // Replace optimistic task with real one
      setTasks(prev => prev.map(task =>
        task.id === tempId ? { ...data, _optimistic: false } : task
      ))

      // Invalidate cache
      if (enableCache) {
        globalCache.invalidate('tasks:')
      }

      optimisticUpdatesRef.current.delete(tempId)
      return { success: true, data }
    } catch (err) {
      // Revert optimistic update
      setTasks(prev => prev.filter(task => task.id !== tempId))
      optimisticUpdatesRef.current.delete(tempId)

      console.error('Error creating task:', err)
      return {
        success: false,
        error: {
          message: err.message || 'Failed to create task',
          code: err.code,
          recoverable: isRetryableError(err)
        }
      }
    }
  }, [enableCache, withRetry])

  // ============================================
  // UPDATE TASK
  // ============================================

  const updateTask = useCallback(async (id, updates) => {
    const previousTask = tasks.find(t => t.id === id)
    if (!previousTask) {
      return { success: false, error: { message: 'Task not found' } }
    }

    // Store previous state for rollback
    const rollbackData = { ...previousTask }

    // Optimistic update
    const optimisticData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    optimisticUpdatesRef.current.set(id, optimisticData)
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, ...optimisticData } : task
    ))

    try {
      const { data, error: updateError } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .update(optimisticData)
          .eq('id', id)
          .select()
          .single()
      }, 'updateTask')

      if (updateError) throw updateError

      // Update with confirmed data
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...data, _optimistic: false } : task
      ))

      if (enableCache) {
        globalCache.invalidate('tasks:')
      }

      optimisticUpdatesRef.current.delete(id)
      return { success: true, data }
    } catch (err) {
      // Rollback optimistic update
      setTasks(prev => prev.map(task =>
        task.id === id ? rollbackData : task
      ))
      optimisticUpdatesRef.current.delete(id)

      console.error('Error updating task:', err)
      return {
        success: false,
        error: {
          message: err.message || 'Failed to update task',
          code: err.code,
          recoverable: isRetryableError(err)
        }
      }
    }
  }, [tasks, enableCache, withRetry])

  // ============================================
  // DELETE TASK
  // ============================================

  const deleteTask = useCallback(async (id) => {
    const previousTask = tasks.find(t => t.id === id)
    if (!previousTask) {
      return { success: false, error: { message: 'Task not found' } }
    }

    // Optimistic update - remove from UI immediately
    setTasks(prev => prev.filter(task => task.id !== id))
    optimisticUpdatesRef.current.set(id, { _deleted: true })

    try {
      const { error: deleteError } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
      }, 'deleteTask')

      if (deleteError) throw deleteError

      if (enableCache) {
        globalCache.invalidate('tasks:')
      }

      optimisticUpdatesRef.current.delete(id)
      return { success: true }
    } catch (err) {
      // Restore task on error
      setTasks(prev => {
        const newTasks = [...prev]
        const insertIndex = newTasks.findIndex(t =>
          new Date(t.created_at) > new Date(previousTask.created_at)
        )
        if (insertIndex === -1) {
          newTasks.push(previousTask)
        } else {
          newTasks.splice(insertIndex, 0, previousTask)
        }
        return newTasks
      })
      optimisticUpdatesRef.current.delete(id)

      console.error('Error deleting task:', err)
      return {
        success: false,
        error: {
          message: err.message || 'Failed to delete task',
          code: err.code,
          recoverable: isRetryableError(err)
        }
      }
    }
  }, [tasks, enableCache, withRetry])

  // ============================================
  // TOGGLE COMPLETE
  // ============================================

  const toggleComplete = useCallback(async (id, completed) => {
    const previousTask = tasks.find(t => t.id === id)
    if (!previousTask) {
      return { success: false, error: { message: 'Task not found' } }
    }

    const rollbackData = { ...previousTask }
    const optimisticData = {
      completed,
      status: completed ? 'Erledigt' : 'Offen',
      updated_at: new Date().toISOString()
    }

    // Optimistic update
    optimisticUpdatesRef.current.set(id, optimisticData)
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, ...optimisticData } : task
    ))

    try {
      const { data, error: toggleError } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .update(optimisticData)
          .eq('id', id)
          .select()
          .single()
      }, 'toggleComplete')

      if (toggleError) throw toggleError

      setTasks(prev => prev.map(task =>
        task.id === id ? { ...data, _optimistic: false } : task
      ))

      if (enableCache) {
        globalCache.invalidate('tasks:')
      }

      optimisticUpdatesRef.current.delete(id)
      return { success: true, data }
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(task =>
        task.id === id ? rollbackData : task
      ))
      optimisticUpdatesRef.current.delete(id)

      console.error('Error toggling completion:', err)
      return {
        success: false,
        error: {
          message: err.message || 'Failed to update task',
          code: err.code,
          recoverable: isRetryableError(err)
        }
      }
    }
  }, [tasks, enableCache, withRetry])

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  const batchDelete = useCallback(async (ids) => {
    const previousTasks = tasks.filter(t => ids.includes(t.id))

    // Optimistic update
    setTasks(prev => prev.filter(task => !ids.includes(task.id)))

    try {
      const { error: batchError } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .delete()
          .in('id', ids)
      }, 'batchDelete')

      if (batchError) throw batchError

      if (enableCache) {
        globalCache.invalidate('tasks:')
      }

      return { success: true, count: ids.length }
    } catch (err) {
      // Restore all tasks
      setTasks(prev => [...prev, ...previousTasks])

      console.error('Error in batch delete:', err)
      return {
        success: false,
        error: {
          message: err.message || 'Failed to delete tasks',
          code: err.code,
          recoverable: isRetryableError(err)
        }
      }
    }
  }, [tasks, enableCache, withRetry])

  const batchUpdateStatus = useCallback(async (ids, completed) => {
    const previousTasks = new Map(tasks.filter(t => ids.includes(t.id)).map(t => [t.id, { ...t }]))

    // Optimistic update
    const updates = {
      completed,
      status: completed ? 'Erledigt' : 'Offen',
      updated_at: new Date().toISOString()
    }

    setTasks(prev => prev.map(task =>
      ids.includes(task.id) ? { ...task, ...updates } : task
    ))

    try {
      // Use the database function for batch update
      const { data, error: batchError } = await withRetry(async () => {
        return await supabase
          .rpc('batch_update_task_status', {
            p_task_ids: ids,
            p_completed: completed,
            p_user_id: (await supabase.auth.getUser()).data.user?.id
          })
      }, 'batchUpdateStatus')

      if (batchError) throw batchError

      if (enableCache) {
        globalCache.invalidate('tasks:')
      }

      return { success: true, count: data }
    } catch (err) {
      // Restore previous state
      setTasks(prev => prev.map(task =>
        previousTasks.has(task.id) ? previousTasks.get(task.id) : task
      ))

      console.error('Error in batch update:', err)
      return {
        success: false,
        error: {
          message: err.message || 'Failed to update tasks',
          code: err.code,
          recoverable: isRetryableError(err)
        }
      }
    }
  }, [tasks, enableCache, withRetry])

  // ============================================
  // REAL-TIME SUBSCRIPTION
  // ============================================

  useEffect(() => {
    if (!enableRealtime) return

    const setupSubscription = async () => {
      // Get current user to filter events
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      subscriptionRef.current = supabase
        .channel('tasks_enhanced')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Skip if this change was triggered by our own optimistic update
            if (payload.eventType === 'INSERT') {
              // Don't add if it was created by this client
              if (!optimisticUpdatesRef.current.has(payload.new.id)) {
                setTasks(prev => {
                  // Check if already exists (from optimistic update)
                  const exists = prev.some(t => t.id === payload.new.id)
                  if (exists) {
                    return prev.map(t =>
                      t.id === payload.new.id ? { ...payload.new, _optimistic: false } : t
                    )
                  }
                  // Insert in correct position (sorted by deadline)
                  const newTasks = [...prev]
                  const insertIndex = newTasks.findIndex(t =>
                    new Date(t.deadline) > new Date(payload.new.deadline)
                  )
                  if (insertIndex === -1) {
                    newTasks.push(payload.new)
                  } else {
                    newTasks.splice(insertIndex, 0, payload.new)
                  }
                  return newTasks
                })
              }
            } else if (payload.eventType === 'UPDATE') {
              // Only update if not currently being optimistically updated
              if (!optimisticUpdatesRef.current.has(payload.new.id)) {
                setTasks(prev => prev.map(task =>
                  task.id === payload.new.id ? { ...payload.new, _optimistic: false } : task
                ))
              }
            } else if (payload.eventType === 'DELETE') {
              if (!optimisticUpdatesRef.current.has(payload.old.id)) {
                setTasks(prev => prev.filter(task => task.id !== payload.old.id))
              }
            }

            // Invalidate cache on any change
            if (enableCache) {
              globalCache.invalidate('tasks:')
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
        })
    }

    setupSubscription()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [enableRealtime, enableCache])

  // ============================================
  // INITIAL FETCH
  // ============================================

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ============================================
  // STATS
  // ============================================

  const stats = useMemo(() => ({
    open: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => {
      if (t.completed) return false
      const deadline = new Date(t.deadline)
      return deadline < new Date()
    }).length,
    total: tasks.length,
    optimistic: tasks.filter(t => t._optimistic).length
  }), [tasks])

  // ============================================
  // RETURN VALUE
  // ============================================

  return {
    // State
    tasks,
    loading,
    error,
    isOnline,
    stats,

    // CRUD Operations
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,

    // Batch Operations
    batchDelete,
    batchUpdateStatus,

    // Utility
    clearError: () => setError(null),
    clearCache: () => globalCache.clear()
  }
}

// ============================================
// USETASKSTATS HOOK (compatible with existing code)
// ============================================

export function useTaskStats(tasks) {
  return useMemo(() => ({
    open: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => {
      if (t.completed) return false
      const deadline = new Date(t.deadline)
      return deadline < new Date()
    }).length
  }), [tasks])
}

// ============================================
// USETASKFILTER HOOK
// ============================================

/**
 * Hook for filtering and sorting tasks
 */
export function useTaskFilter(tasks, options = {}) {
  const {
    searchQuery = '',
    filters = {},
    sortConfig = { field: 'deadline', direction: 'asc' }
  } = options

  const priorityOrder = { 'Hoch': 1, 'Mittel': 2, 'Niedrig': 3 }

  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.category && filters.category !== 'Alle') {
      result = result.filter(task => task.category === filters.category)
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'Alle') {
      result = result.filter(task => task.priority === filters.priority)
    }

    // Status filter
    if (filters.status && filters.status !== 'Alle') {
      result = result.filter(task =>
        filters.status === 'Erledigt' ? task.completed : !task.completed
      )
    }

    // Time range filter
    if (filters.timeRange && filters.timeRange !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const monthEnd = new Date(today)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      switch (filters.timeRange) {
        case 'today':
          result = result.filter(task => {
            const deadline = new Date(task.deadline)
            return deadline >= today && deadline < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          })
          break
        case 'week':
          result = result.filter(task => {
            const deadline = new Date(task.deadline)
            return deadline >= today && deadline <= weekEnd
          })
          break
        case 'month':
          result = result.filter(task => {
            const deadline = new Date(task.deadline)
            return deadline >= today && deadline <= monthEnd
          })
          break
        case 'overdue':
          result = result.filter(task => !task.completed && new Date(task.deadline) < now)
          break
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortConfig.field) {
        case 'deadline':
          comparison = new Date(a.deadline) - new Date(b.deadline)
          break
        case 'created_at':
          comparison = new Date(a.created_at) - new Date(b.created_at)
          break
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    // Always show incomplete tasks first
    result.sort((a, b) => {
      if (a.completed && !b.completed) return 1
      if (!a.completed && b.completed) return -1
      return 0
    })

    return result
  }, [tasks, searchQuery, filters, sortConfig])

  return filteredTasks
}
