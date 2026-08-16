import React from 'react';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  title?: string;
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  data,
  size = 160,
  strokeWidth = 24,
  centerLabel,
  centerValue,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {title && (
        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, marginBottom: '1rem', width: '100%', textAlign: 'left', color: 'var(--text-primary)' }}>
          {title}
        </h4>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* SVG Circle */}
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background base circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {total > 0 &&
              data.map((slice, idx) => {
                const percent = slice.value / total;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += percent;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                );
              })}
          </svg>

          {/* Center Text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {centerValue !== undefined && (
              <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {centerLabel}
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
          {data.map((slice, idx) => {
            const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: 'var(--font-size-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      width: '0.625rem',
                      height: '0.625rem',
                      borderRadius: '2px',
                      backgroundColor: slice.color,
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>{slice.label}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {slice.value} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
