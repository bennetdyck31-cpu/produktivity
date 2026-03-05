export function PieChart({ completed, total, size = 50 }) {
  if (total === 0) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        className="circular-chart"
      >
        <circle
          className="circle-bg"
          cx="18"
          cy="18"
          r="15.9"
        />
      </svg>
    )
  }

  const percentage = (completed / total) * 100
  const radius = 15.9
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
  const rotation = -90 // Start from top

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className="circular-chart"
    >
      {/* Background circle */}
      <circle
        className="circle-bg"
        cx="18"
        cy="18"
        r={radius}
      />

      {/* Progress circle (completed tasks) */}
      <circle
        className="circle-progress"
        cx="18"
        cy="18"
        r={radius}
        strokeDasharray={strokeDasharray}
        strokeDashoffset="0"
        transform={`rotate(${rotation} 18 18)`}
      />

      {/* Center text */}
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '8px',
          fontWeight: '600',
          fill: 'var(--text-primary)'
        }}
      >
        {completed}/{total}
      </text>
    </svg>
  )
}