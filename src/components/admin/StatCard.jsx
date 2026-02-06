/**
 * StatCard Component
 * Reusable statistics card for dashboards
 */
export const StatCard = ({
    title,
    value,
    subtitle,
    change,
    trend,
    icon,
    breakdown,
    realtime = false,
    pulse = false,
    alert = false
}) => {
    const getTrendColor = () => {
        if (!trend) return 'var(--text-secondary)';
        return trend === 'up' ? 'var(--success)' : 'var(--danger)';
    };

    const getTrendIcon = () => {
        if (!trend) return '';
        return trend === 'up' ? '↑' : '↓';
    };

    return (
        <div className={`card-glass ${pulse ? 'pulse-animation' : ''}`} style={{
            padding: 'var(--spacing-lg)',
            position: 'relative',
            borderLeft: alert ? '4px solid var(--danger)' : 'none'
        }}>
            {realtime && (
                <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    right: 'var(--spacing-md)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    boxShadow: '0 0 8px var(--success)',
                    animation: 'pulse 2s infinite'
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                {icon && (
                    <div style={{
                        fontSize: '2.5rem',
                        lineHeight: 1
                    }}>
                        {icon}
                    </div>
                )}

                <div style={{ flex: 1 }}>
                    <p style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-xs)'
                    }}>
                        {title}
                    </p>

                    <h2 style={{
                        margin: 0,
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: subtitle || change ? 'var(--spacing-xs)' : 0
                    }}>
                        {value}
                    </h2>

                    {subtitle && (
                        <p style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                        }}>
                            {subtitle}
                        </p>
                    )}

                    {change && (
                        <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: getTrendColor(),
                            marginTop: 'var(--spacing-xs)',
                            fontWeight: '600'
                        }}>
                            {getTrendIcon()} {change}
                        </p>
                    )}

                    {breakdown && (
                        <div style={{
                            marginTop: 'var(--spacing-md)',
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            flexWrap: 'wrap'
                        }}>
                            {Object.entries(breakdown).map(([key, val]) => (
                                <div key={key} style={{ fontSize: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{key}:</span>{' '}
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
