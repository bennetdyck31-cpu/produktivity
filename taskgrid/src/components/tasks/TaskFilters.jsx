import { useCallback, useMemo } from 'react'
import { Filter, SortAsc, SortDesc } from 'lucide-react'

const categories = ['Alle', 'Arbeit', 'Privat', 'Schule', 'Sonstiges']
const priorities = ['Alle', 'Hoch', 'Mittel', 'Niedrig']
const statuses = ['Alle', 'Offen', 'In Arbeit', 'Erledigt']
const timeRanges = [
  { value: 'all', label: 'Alle Zeiträume' },
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' },
  { value: 'overdue', label: 'Überfällig' }
]

export function TaskFilters({ filters, onFilterChange, sortConfig, onSortChange }) {
  const handleCategoryChange = useCallback((e) => {
    onFilterChange('category', e.target.value)
  }, [onFilterChange])

  const handlePriorityChange = useCallback((e) => {
    onFilterChange('priority', e.target.value)
  }, [onFilterChange])

  const handleStatusChange = useCallback((e) => {
    onFilterChange('status', e.target.value)
  }, [onFilterChange])

  const handleTimeRangeChange = useCallback((e) => {
    onFilterChange('timeRange', e.target.value)
  }, [onFilterChange])

  const handleSortFieldChange = useCallback((e) => {
    onSortChange('field', e.target.value)
  }, [onSortChange])

  const handleSortDirectionToggle = useCallback(() => {
    onSortChange('direction', sortConfig.direction === 'asc' ? 'desc' : 'asc')
  }, [onSortChange, sortConfig.direction])

  const sortIcon = useMemo(() => {
    return sortConfig.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
  }, [sortConfig.direction])
  return (
    <div className="filter-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <Filter size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Filter:</span>
      </div>

      <select
        className="filter-select"
        value={filters.category}
        onChange={handleCategoryChange}
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.priority}
        onChange={handlePriorityChange}
      >
        {priorities.map(prio => (
          <option key={prio} value={prio}>{prio}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.status}
        onChange={handleStatusChange}
      >
        {statuses.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.timeRange}
        onChange={handleTimeRangeChange}
      >
        {timeRanges.map(range => (
          <option key={range.value} value={range.value}>{range.label}</option>
        ))}
      </select>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sortieren:</span>
        <select
          className="filter-select"
          style={{ minWidth: '120px' }}
          value={sortConfig.field}
          onChange={handleSortFieldChange}
        >
          <option value="deadline">Deadline</option>
          <option value="created_at">Erstellt</option>
          <option value="priority">Priorität</option>
          <option value="title">Titel</option>
        </select>
        <button
          className="btn-secondary"
          onClick={handleSortDirectionToggle}
          style={{ padding: 'var(--spacing-sm)' }}
        >
          {sortIcon}
        </button>
      </div>
    </div>
  )
}
