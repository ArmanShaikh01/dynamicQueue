import { useState } from 'react';

/**
 * AdvancedTable Component
 * Sortable, filterable, paginated table for admin panels
 */
export const AdvancedTable = ({
    data = [],
    columns = [],
    onRowClick,
    sortable = true,
    filterable = true,
    paginated = true,
    itemsPerPage = 10,
    actions,
    emptyMessage = 'No data available'
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Sorting logic
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Filtering logic
    const filteredData = searchTerm
        ? sortedData.filter(row =>
            columns.some(col =>
                String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        : sortedData;

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = paginated
        ? filteredData.slice(startIndex, startIndex + itemsPerPage)
        : filteredData;

    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '⇅';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="card-glass">
            {filterable && (
                <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border)' }}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            width: '100%',
                            maxWidth: '400px'
                        }}
                    />
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr style={{
                            borderBottom: '2px solid var(--border)',
                            background: 'rgba(102, 126, 234, 0.05)'
                        }}>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        textAlign: 'left',
                                        fontWeight: '600',
                                        cursor: sortable && col.sortable !== false ? 'pointer' : 'default',
                                        userSelect: 'none'
                                    }}
                                >
                                    {col.label}
                                    {sortable && col.sortable !== false && (
                                        <span style={{ marginLeft: 'var(--spacing-xs)', opacity: 0.5 }}>
                                            {getSortIcon(col.key)}
                                        </span>
                                    )}
                                </th>
                            ))}
                            {actions && <th style={{ padding: 'var(--spacing-md)' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    style={{
                                        padding: 'var(--spacing-xl)',
                                        textAlign: 'center',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, index) => (
                                <tr
                                    key={index}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    style={{
                                        borderBottom: '1px solid var(--border)',
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        transition: 'background var(--transition-base)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (onRowClick) e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (onRowClick) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {columns.map(col => (
                                        <td key={col.key} style={{ padding: 'var(--spacing-md)' }}>
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {paginated && totalPages > 1 && (
                <div style={{
                    padding: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="btn-secondary"
                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
                        >
                            Previous
                        </button>

                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        minWidth: '40px'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="btn-secondary"
                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedTable;
