import { useState, useEffect, useCallback, useMemo } from 'react'
import { X } from 'lucide-react'
import { categories } from '../ui/CategoryBadge'
import { priorities } from '../ui/PriorityPill'

const initialFormState = {
  title: '',
  description: '',
  category: 'Sonstiges',
  priority: 'Mittel',
  deadline_date: '',
  deadline_time: ''
}

export function TaskModal({ isOpen, onClose, onSave, editTask }) {
  const [formData, setFormData] = useState(initialFormState)
  const [errors, setErrors] = useState({})

  // Reset form when modal opens/closes or edit task changes
  useEffect(() => {
    if (editTask) {
      const deadline = new Date(editTask.deadline)
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        category: editTask.category,
        priority: editTask.priority,
        deadline_date: deadline.toISOString().split('T')[0],
        deadline_time: deadline.toTimeString().slice(0, 5)
      })
    } else {
      setFormData(initialFormState)
    }
    setErrors({})
  }, [editTask, isOpen])

  // Memoisierte Change-Handler
  const handleTitleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, title: e.target.value }))
  }, [])

  const handleDescriptionChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }))
  }, [])

  const handleCategoryChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, category: e.target.value }))
  }, [])

  const handlePriorityChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, priority: e.target.value }))
  }, [])

  const handleDeadlineDateChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, deadline_date: e.target.value }))
  }, [])

  const handleDeadlineTimeChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, deadline_time: e.target.value }))
  }, [])

  const validate = useCallback(() => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich'
    }

    if (!formData.deadline_date) {
      newErrors.deadline_date = 'Deadline Datum ist erforderlich'
    }

    if (!formData.deadline_time) {
      newErrors.deadline_time = 'Deadline Uhrzeit ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData.title, formData.deadline_date, formData.deadline_time])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()

    if (!validate()) return

    const deadline = new Date(`${formData.deadline_date}T${formData.deadline_time}`)

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority,
      deadline: deadline.toISOString(),
      status: editTask?.status || 'Offen'
    }

    onSave(taskData, editTask?.id)
  }, [formData, editTask, onSave, validate])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      handleSubmit(e)
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }, [handleSubmit, onClose])

  // Min-Date für Date-Input (nur für neue Tasks, bei Bearbeitung erlauben)
  const minDate = useMemo(() => {
    // Bei Bearbeitung: kein minDate, sonst heute
    return editTask ? null : new Date().toISOString().split('T')[0]
  }, [editTask])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {editTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-required">Titel</label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="Aufgabentitel eingeben..."
              autoFocus
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Kurze Beschreibung (optional)..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kategorie</label>
            <select
              className="form-input"
              value={formData.category}
              onChange={handleCategoryChange}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priorität</label>
            <div className="radio-group">
              {priorities.map(prio => (
                <label key={prio} className="radio-label">
                  <input
                    type="radio"
                    name="priority"
                    value={prio}
                    checked={formData.priority === prio}
                    onChange={handlePriorityChange}
                  />
                  {prio}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label form-required">Deadline Datum</label>
              <input
                type="date"
                className={`form-input ${errors.deadline_date ? 'error' : ''}`}
                value={formData.deadline_date}
                onChange={handleDeadlineDateChange}
                min={minDate}
              />
              {errors.deadline_date && <p className="form-error">{errors.deadline_date}</p>}
            </div>

            <div className="form-group">
              <label className="form-label form-required">Deadline Uhrzeit</label>
              <input
                type="time"
                className={`form-input ${errors.deadline_time ? 'error' : ''}`}
                value={formData.deadline_time}
                onChange={handleDeadlineTimeChange}
              />
              {errors.deadline_time && <p className="form-error">{errors.deadline_time}</p>}
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: 'var(--spacing-md)' }}>
              ⚠️ Deadline ist ein Pflichtfeld
            </p>
          )}

          <div className="flex justify-between gap-md" style={{ marginTop: 'var(--spacing-lg)' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              {editTask ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
