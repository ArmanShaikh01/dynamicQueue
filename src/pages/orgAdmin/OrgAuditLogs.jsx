import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchOrgAuditLogs } from '../../services/analyticsService';
import { exportAuditLogsToExcel } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import '../../../src/styles/Analytics.css';

const OrgAuditLogs = () => {
    const { userProfile } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        action: '',
        entityType: '',
        search: ''
    });

    useEffect(() => {
        if (userProfile?.organizationId) {
            loadLogs();
        }
    }, [userProfile]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchOrgAuditLogs(userProfile.organizationId, filters);
            setLogs(data);
            console.log('📋 Audit logs loaded:', data.length);
        } catch (error) {
            console.error('Error loading audit logs:', error);
            toast.error('Failed to load audit logs');
        }
        setLoading(false);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const filteredLogs = getFilteredLogs();
            const result = await exportAuditLogsToExcel(filteredLogs, userProfile.organizationName || 'Organization');
            if (result.success) {
                toast.success(`Exported ${filteredLogs.length} logs to ${result.filename}`);
            } else {
                toast.error('Failed to export audit logs');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export audit logs');
        }
        setExporting(false);
    };

    const getFilteredLogs = () => {
        return logs.filter(log => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    log.action?.toLowerCase().includes(searchLower) ||
                    log.userName?.toLowerCase().includes(searchLower) ||
                    log.userEmail?.toLowerCase().includes(searchLower) ||
                    log.entityType?.toLowerCase().includes(searchLower);

                if (!matchesSearch) return false;
            }

            return true;
        });
    };

    const filteredLogs = getFilteredLogs();

    // Get unique actions and entity types for filter dropdowns
    const uniqueActions = [...new Set(logs.map(log => log.action).filter(Boolean))];
    const uniqueEntityTypes = [...new Set(logs.map(log => log.entityType).filter(Boolean))];

    return (
        <div className="analytics-container">
            {/* Header */}
            <div className="analytics-header">
                <div>
                    <h1>📋 Audit Logs</h1>
                    <p>Organization: {userProfile.organizationName || 'Your Organization'}</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={exporting || filteredLogs.length === 0}
                    >
                        📥 Export to Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass" style={{ marginBottom: '2rem' }}>
                <h3>Filters</h3>
                <div className="grid grid-cols-1 grid-md-4">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Action Type</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        >
                            <option value="">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Entity Type</label>
                        <select
                            value={filters.entityType}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                        >
                            <option value="">All Types</option>
                            {uniqueEntityTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 grid-md-2" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="Search by action, user, or entity..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <button className="btn btn-primary" onClick={loadLogs} style={{ marginTop: '1.5rem' }}>
                            🔍 Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Count */}
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Showing {filteredLogs.length} of {logs.length} logs
            </div>

            {/* Logs Table */}
            <div className="card-glass">
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading audit logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Action</th>
                                    <th>Performed By</th>
                                    <th>Role</th>
                                    <th>Entity Type</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <tr key={log.id || index}>
                                        <td>
                                            {log.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}
                                        </td>
                                        <td>
                                            <span className="badge badge-info">
                                                {log.action || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>
                                                    {log.userName || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {log.userEmail || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-secondary">
                                                {log.userRole || 'N/A'}
                                            </span>
                                        </td>
                                        <td>{log.entityType || 'N/A'}</td>
                                        <td>
                                            <details>
                                                <summary style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                                                    View Details
                                                </summary>
                                                <pre style={{
                                                    fontSize: '0.75rem',
                                                    marginTop: '0.5rem',
                                                    padding: '0.5rem',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '4px',
                                                    overflow: 'auto',
                                                    maxWidth: '300px'
                                                }}>
                                                    {JSON.stringify(log.metadata || log.details || {}, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                        <td>{log.ipAddress || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrgAuditLogs;
