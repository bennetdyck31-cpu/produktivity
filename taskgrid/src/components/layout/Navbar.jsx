import { useCallback } from 'react'
import { Bell, User, Search } from 'lucide-react'

export function Navbar({ searchQuery, onSearchChange }) {
  const handleSearchChange = useCallback((e) => {
    onSearchChange(e.target.value)
  }, [onSearchChange])

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>📋</span>
        <span>TaskGrid</span>
      </div>

      <div className="navbar-search">
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Aufgaben durchsuchen..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ paddingLeft: '40px', width: '100%' }}
          />
        </div>
      </div>

      <div className="navbar-actions">
        <button className="navbar-icon-btn" title="Benachrichtigungen">
          <Bell size={20} />
        </button>
        <button className="navbar-icon-btn" title="Profil">
          <User size={20} />
        </button>
      </div>
    </nav>
  )
}
