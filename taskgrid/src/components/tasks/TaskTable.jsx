import { useState } from 'react'
import { TaskRow } from './TaskRow'

export function TaskTable({ tasks, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <h3 className="empty-state-title">Keine Aufgaben gefunden</h3>
        <p className="empty-state-description">
          Erstelle deine erste Aufgabe, um den Überblick über deine Deadlines zu behalten.
        </p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="task-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>☐</th>
            <th style={{ minWidth: '200px' }}>Aufgabe</th>
            <th style={{ minWidth: '150px' }}>Beschreibung</th>
            <th style={{ width: '120px' }}>Kategorie</th>
            <th style={{ width: '100px' }}>Priorität</th>
            <th style={{ width: '150px' }}>Deadline</th>
            <th style={{ width: '100px' }}>Erstellt</th>
            <th style={{ width: '100px' }}>Status</th>
            <th style={{ width: '80px' }}>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
