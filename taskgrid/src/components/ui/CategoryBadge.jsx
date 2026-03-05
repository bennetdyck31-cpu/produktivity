const categoryColors = {
  'Arbeit': 'var(--category-arbeit)',
  'Privat': 'var(--category-privat)',
  'Schule': 'var(--category-schule)',
  'Sonstiges': 'var(--category-sonstiges)'
}

const categoryIcons = {
  'Arbeit': '💼',
  'Privat': '🏠',
  'Schule': '📚',
  'Sonstiges': '📌'
}

export function CategoryBadge({ category }) {
  const color = categoryColors[category] || categoryColors['Sonstiges']
  const icon = categoryIcons[category] || categoryIcons['Sonstiges']

  return (
    <span
      className="badge badge-category"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {icon} {category}
    </span>
  )
}

export const categories = ['Arbeit', 'Privat', 'Schule', 'Sonstiges']
