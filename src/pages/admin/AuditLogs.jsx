import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { ADMIN_COLLECTIONS, AUDIT_ACTIONS, ENTITY_TYPES } from '../../models/adminSchema';
import AdvancedTable from '../../components/admin/AdvancedTable';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { PERMISSION_CODES } from '../../models/permissions';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        userId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            let q = query(
                collection(db, ADMIN_COLLECTIONS.AUDIT_LOGS),
                orderBy('timestamp', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(q);
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setLogs(logsData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading audit logs:', error);
            toast.error('Failed to load audit logs');
            setLoading(false);
        }
    };

    const getFilteredLogs = () => {
        return logs.filter(log => {
            if (filters.action && log.action !== filters.action) return false;
            if (filters.entityType && log.entityType !== filters.entityType) return false;
            if (filters.userId && !log.userId.includes(filters.userId)) return false;
            return true;
        });
    };

    const getActionBadge = (action) => {
        const colors = {
            CREATED: 'success',
            UPDATED: 'primary',
            DELETED: 'danger',
            APPROVED: 'success',
            SUSPENDED: 'danger',
            OVERRIDDEN: 'warning'
        };

        const type = action.split('_').pop();
        const badgeClass = colors[type] || 'secondary';

        return <span className={`badge badge-${badgeClass}`}>{action}</span>;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate();
        return date.toLocaleString();
    };

    const tableColumns = [
        {
            key: 'timestamp',
            label: 'Timestamp',
            render: (value) => (
                <div style={{ fontSize: '0.875rem' }}>
                    {formatTimestamp(value)}
                </div>
            )
        },
        {
            key: 'userName',
            label: 'User',
            render: (value, row) => (
                <div style={{ fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: '600' }}>{value}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {row.userRole}
                    </div>
                </div>
            )
        },
        {
            key: 'action',
            label: 'Action',
            render: (value) => getActionBadge(value)
        },
        {
            key: 'entityType',
            label: 'Entity Type',
            render: (value) => <span className="badge">{value}</span>
        },
        {
            key: 'entityId',
            label: 'Entity ID',
            render: (value) => (
                <code style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
                    {value.substring(0, 8)}...
                </code>
            )
        }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading audit logs...</p>
            </div>
        );
    }

    const filteredLogs = getFilteredLogs();

    return (
        <PermissionGuard permission={PERMISSION_CODES.PLATFORM_VIEW_AUDIT_LOGS} redirect>
            <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="gradient-text">📋 Audit Logs</h1>
                <p>Track all administrative actions and changes</p>

                {/* Filters */}
                <div className="card-glass" style={{ marginBottom: '2rem' }}>
                    <h3>Filters</h3>
                    <div className="grid grid-cols-1 grid-md-2 grid-lg-4">
                        <div className="form-group">
                            <label>Action Type</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            >
                                <option value="">All Actions</option>
                                {Object.values(AUDIT_ACTIONS).map(action => (
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
                                {Object.values(ENTITY_TYPES).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>User ID</label>
                            <input
                                type="text"
                                value={filters.userId}
                                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                                placeholder="Search by user ID"
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={() => setFilters({ action: '', entityType: '', userId: '', startDate: '', endDate: '' })}
                                className="btn-secondary"
                                style={{ width: '100%' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <AdvancedTable
                    data={filteredLogs}
                    columns={tableColumns}
                    onRowClick={(row) => {
                        console.log('Audit log details:', row);
                        // Could open a modal with full details
                    }}
                    emptyMessage="No audit logs found"
                />

                <div style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Showing {filteredLogs.length} of {logs.length} total logs
                </div>
            </div>
        </PermissionGuard>
    );
};

export default AuditLogs;
