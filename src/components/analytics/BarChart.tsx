import React from 'react';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
}

export interface BarChartProps {
  title?: string;
  data: BarChartDataPoint[];
  height?: number;
  horizontal?: boolean;
  valueSuffix?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  horizontal = true,
  valueSuffix = '',
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <div style={{ width: '100%' }}>
        {title && (
          <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {title}
          </h4>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {data.map((item, idx) => {
            const percentage = Math.round((item.value / maxValue) * 100);
            const color = item.color || 'var(--color-primary-600)';

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {item.value} {valueSuffix}
                    {item.subLabel && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                        ({item.subLabel})
                      </span>
                    )}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '0.5rem',
                    backgroundColor: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: color,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical Bar Chart
  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
          {title}
        </h4>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '0.5rem',
          height: '140px',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {data.map((item, idx) => {
          const heightPercent = Math.max(8, Math.round((item.value / maxValue) * 100));
          const color = item.color || 'var(--color-primary-600)';

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {item.value}
              </span>
              <div
                style={{
                  width: '70%',
                  maxWidth: '32px',
                  height: `${heightPercent}%`,
                  backgroundColor: color,
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 0.6s ease',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-1.25rem',
                  fontSize: '0.625rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  textAlign: 'center',
                }}
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
