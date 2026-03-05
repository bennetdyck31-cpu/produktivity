// Simple SVG Pie Chart / Circular Progress indicator

export function PieChart({ percent }) {
    const radius = 15.9155; // magic radius for circumference = 100
    const dashArray = `${percent}, 100`;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 36 36" className="circular-chart" style={{ width: '40px', height: '40px' }}>
                <path className="circle-bg"
                    d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path className="circle-progress"
                    strokeDasharray={dashArray}
                    d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
                />
            </svg>
            {percent > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-green)' }}>{percent}%</span>}
        </div>
    )
}
