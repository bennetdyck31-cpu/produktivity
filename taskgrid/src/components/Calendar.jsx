import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayCell } from './DayCell'
import { supabase } from '../lib/supabase'

export function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [expandedDateStr, setExpandedDateStr] = useState(null)
    const [tasksByDate, setTasksByDate] = useState({})

    // ── Load all tasks once on mount ──────────────────
    useEffect(() => {
        async function loadTasks() {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) { console.error('Supabase load error:', error); return }

            const grouped = {}
            data.forEach(task => {
                const d = task.day_date  // already YYYY-MM-DD
                if (!grouped[d]) grouped[d] = []
                grouped[d].push(task)
            })
            setTasksByDate(grouped)
        }
        loadTasks()
    }, [])

    // ── Calendar grid math ────────────────────────────
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const days = useMemo(() => {
        const arr = []
        const prevDays = new Date(year, month, 0).getDate()

        for (let i = startingDay - 1; i >= 0; i--)
            arr.push({ dateScore: prevDays - i, isCurrentMonth: false })

        for (let i = 1; i <= daysInMonth; i++) {
            const mStr = String(month + 1).padStart(2, '0')
            const dStr = String(i).padStart(2, '0')
            arr.push({
                dateScore: i,
                isCurrentMonth: true,
                dateString: `${year}-${mStr}-${dStr}`,
                dateObj: new Date(year, month, i)
            })
        }

        const pad = 42 - arr.length
        for (let i = 1; i <= pad; i++)
            arr.push({ dateScore: i, isCurrentMonth: false })

        return arr
    }, [year, month, startingDay, daysInMonth])

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    const toggleExpand = (dateStr) =>
        setExpandedDateStr(prev => prev === dateStr ? null : dateStr)

    // ── CRUD ─────────────────────────────────────────
    const handleTaskAdd = async (dateStr, title) => {
        const { data, error } = await supabase
            .from('tasks')
            .insert({ title, day_date: dateStr })
            .select()
            .single()

        if (error) { console.error('Insert error:', error); return }

        setTasksByDate(prev => ({
            ...prev,
            [dateStr]: [...(prev[dateStr] || []), data]
        }))
    }

    const handleTaskUpdate = async (dateStr, taskId, updates) => {
        const { error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)

        if (error) { console.error('Update error:', error); return }

        setTasksByDate(prev => ({
            ...prev,
            [dateStr]: (prev[dateStr] || []).map(t =>
                t.id === taskId ? { ...t, ...updates } : t
            )
        }))
    }

    const handleTaskDelete = async (dateStr, taskId) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (error) { console.error('Delete error:', error); return }

        setTasksByDate(prev => ({
            ...prev,
            [dateStr]: (prev[dateStr] || []).filter(t => t.id !== taskId)
        }))
    }

    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ]

    return (
        <div className="calendar-wrapper">
            <div className="calendar-header-controls">
                <button onClick={prevMonth}><ChevronLeft size={22} /></button>
                <h2>{monthNames[month]} {year}</h2>
                <button onClick={nextMonth}><ChevronRight size={22} /></button>
            </div>

            <div className="calendar-weekdays">
                <div>Mo</div><div>Di</div><div>Mi</div>
                <div>Do</div><div>Fr</div><div>Sa</div><div>So</div>
            </div>

            <div className="calendar-grid">
                {days.map((dayObj, i) => {
                    if (!dayObj.isCurrentMonth)
                        return <div key={i} className="day-cell other-month">{dayObj.dateScore}</div>

                    const dateStr = dayObj.dateString
                    return (
                        <DayCell
                            key={dateStr}
                            dateString={dateStr}
                            dateObj={dayObj.dateObj}
                            dateScore={dayObj.dateScore}
                            isExpanded={expandedDateStr === dateStr}
                            tasks={tasksByDate[dateStr] || []}
                            onClick={() => toggleExpand(dateStr)}
                            onClose={e => { e.stopPropagation(); setExpandedDateStr(null) }}
                            onTaskAdd={title => handleTaskAdd(dateStr, title)}
                            onTaskUpdate={(id, updates) => handleTaskUpdate(dateStr, id, updates)}
                            onTaskDelete={id => handleTaskDelete(dateStr, id)}
                        />
                    )
                })}
            </div>
        </div>
    )
}
