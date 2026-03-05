import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {title}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
          {message}
        </p>

        <div className="flex justify-between gap-md">
          <button className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}
