import React from 'react';
import './Table.css';

/**
 * Reusable Table component.
 * Supports loading state, empty state, and column keys.
 */
const Table = ({ headers, data, loading, emptyMessage = 'No records found' }) => {
  if (loading) {
    return (
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((h, colIdx) => (
                  <td key={colIdx}>
                    <div className="table-skeleton-cell"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive animate-fade-in">
      <table className="custom-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ width: h.width || 'auto' }}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="table-empty-state">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {headers.map((h, colIdx) => (
                  <td key={colIdx}>
                    {h.render ? h.render(row) : row[h.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
