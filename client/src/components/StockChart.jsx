import React from 'react';
import './StockChart.css';

/**
 * Custom SVG chart component.
 * Supports:
 * - 'movements' (Grouped vertical bars for Stock In / Out)
 * - 'donut' (Circular partition chart for Category shares)
 */
const StockChart = ({ type = 'movements', data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-fallback">
        <span>No data available to display</span>
      </div>
    );
  }

  // --- RENDERING DOUBLE BAR CHART (IN vs OUT movements) ---
  if (type === 'movements') {
    const svgWidth = 500;
    const svgHeight = 260;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    // Find max value in dataset to scale Y axis
    const maxVal = Math.max(
      ...data.map(d => Math.max(parseFloat(d.stock_in) || 0, parseFloat(d.stock_out) || 0)),
      100 // baseline min limit
    );
    const yMax = Math.ceil(maxVal * 1.15); // Add 15% headroom

    const getX = (index) => padding.left + (index * (chartWidth / data.length)) + (chartWidth / (data.length * 4));
    const getY = (value) => padding.top + chartHeight - (value / yMax) * chartHeight;
    const getBarHeight = (value) => (value / yMax) * chartHeight;

    const groupWidth = chartWidth / data.length;
    const barWidth = groupWidth * 0.35; // Size of individual bars

    // Generate grid lines
    const gridTicks = [0, 0.25, 0.5, 0.75, 1];

    return (
      <div className="svg-chart-container">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
          {/* Horizontal Gridlines */}
          {gridTicks.map((tick, i) => {
            const yVal = yMax * tick;
            const yPos = getY(yVal);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={svgWidth - padding.right}
                  y2={yPos}
                  className="chart-gridline"
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  className="chart-axis-label text-right"
                >
                  {Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Render Bars */}
          {data.map((item, idx) => {
            const xGroup = padding.left + (idx * groupWidth);
            const valIn = parseFloat(item.stock_in) || 0;
            const valOut = parseFloat(item.stock_out) || 0;

            const barInX = xGroup + (groupWidth * 0.12);
            const barOutX = xGroup + (groupWidth * 0.12) + barWidth + 4;

            return (
              <g key={idx} className="chart-group">
                {/* Stock In Bar (Primary Blue) */}
                <rect
                  x={barInX}
                  y={getY(valIn)}
                  width={barWidth}
                  height={Math.max(getBarHeight(valIn), 2)}
                  rx="3"
                  className="chart-bar-in"
                />
                
                {/* Stock Out Bar (Accent Red/Orange) */}
                <rect
                  x={barOutX}
                  y={getY(valOut)}
                  width={barWidth}
                  height={Math.max(getBarHeight(valOut), 2)}
                  rx="3"
                  className="chart-bar-out"
                />

                {/* X-Axis labels */}
                <text
                  x={xGroup + (groupWidth / 2)}
                  y={svgHeight - padding.bottom + 20}
                  className="chart-axis-label text-center"
                >
                  {item.month}
                </text>
              </g>
            );
          })}

          {/* Bottom boundary line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="var(--border-color)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Legend */}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot in-dot"></span>
            <span>Stock In (Qty)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot out-dot"></span>
            <span>Stock Out (Qty)</span>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING CIRCULAR DONUT CHART (Category shares) ---
  if (type === 'donut') {
    const total = data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    
    // Fallback if empty sums
    if (total === 0) {
      return <div className="chart-fallback">No category allocations found</div>;
    }

    const radius = 50;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius; // ~314.16
    const size = 150;
    const center = size / 2;

    // Soft palette colors
    const colors = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Orange
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#06b6d4'  // Cyan
    ];

    let accumulatedPercentage = 0;

    return (
      <div className="donut-chart-wrapper">
        <div className="donut-svg-container">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((item, idx) => {
              const val = parseFloat(item.value) || 0;
              const percentage = val / total;
              
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = circumference - (accumulatedPercentage * circumference) + (circumference / 4); // rotate 90deg start
              
              accumulatedPercentage += percentage;
              const color = colors[idx % colors.length];

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="donut-segment"
                />
              );
            })}
            
            {/* Center label */}
            <circle cx={center} cy={center} r={radius - strokeWidth/2} fill="var(--bg-card)" />
            <text x={center} y={center - 2} className="donut-center-num text-center">
              {total}
            </text>
            <text x={center} y={center + 14} className="donut-center-label text-center">
              Items
            </text>
          </svg>
        </div>

        {/* Legend panel */}
        <div className="donut-legend-panel">
          {data.map((item, idx) => {
            const val = parseFloat(item.value) || 0;
            const color = colors[idx % colors.length];
            const pct = Math.round((val / total) * 100);

            return (
              <div key={idx} className="donut-legend-row">
                <span className="donut-color-dot" style={{ backgroundColor: color }}></span>
                <span className="donut-label-text">{item.name}</span>
                <span className="donut-value-text">{val} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default StockChart;
