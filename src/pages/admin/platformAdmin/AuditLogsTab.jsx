import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const AuditLogsTab = ({ selectedOrg }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('all');
    const [userTypeFilter, setUserTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedOrg, actionFilter, userTypeFilter, dateRange]);

    const fetchOrganizations = async () => {
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const orgsData = orgsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        setOrganizations(orgsData);
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let q = collection(db, 'auditLogs');
            const constraints = [];

            if (selectedOrg !== 'all') {
                constraints.push(where('organizationId', '==', selectedOrg));
            }

            if (userTypeFilter !== 'all') {
                constraints.push(where('userType', '==', userTypeFilter));
            }

            if (actionFilter !== 'all') {
                constraints.push(where('action', '==', actionFilter));
            }

            if (dateRange.start) {
                const startDate = Timestamp.fromDate(new Date(dateRange.start));
                constraints.push(where('timestamp', '>=', startDate));
            }

            if (dateRange.end) {
                const endDate = Timestamp.fromDate(new Date(dateRange.end + 'T23:59:59'));
                constraints.push(where('timestamp', '<=', endDate));
            }

            q = query(q, ...constraints, orderBy('timestamp', 'desc'), limit(200));

            const snapshot = await getDocs(q);
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setLogs(logsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Failed to load audit logs');
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        const actionMap = {
            'booking_created': { label: '📅 Booking Created', class: 'badge-success' },
            'booking_cancelled': { label: '❌ Booking Cancelled', class: 'badge-danger' },
            'qr_scanned': { label: '📱 QR Scanned', class: 'badge-info' },
            'token_called': { label: '🔔 Token Called', class: 'badge-warning' },
            'service_created': { label: '➕ Service Created', class: 'badge-success' },
            'service_updated': { label: '✏️ Service Updated', class: 'badge-info' },
            'employee_added': { label: '👔 Employee Added', class: 'badge-success' },
        };

        const actionInfo = actionMap[action] || { label: action, class: 'badge-secondary' };
        return <span className={`badge ${actionInfo.class}`}>{actionInfo.label}</span>;
    };

    const getUserTypeBadge = (userType) => {
        const typeMap = {
            'customer': { label: '👤 Customer', class: 'badge-primary' },
            'employee': { label: '👔 Employee', class: 'badge-info' },
            'orgAdmin': { label: '🔧 Org Admin', class: 'badge-warning' },
            'platformAdmin': { label: '⚡ Platform Admin', class: 'badge-danger' },
        };

        const typeInfo = typeMap[userType] || { label: userType, class: 'badge-secondary' };
        return <span className={`badge ${typeInfo.class}`}>{typeInfo.label}</span>;
    };

    const exportToExcel = () => {
        if (logs.length === 0) {
            toast.error('No audit logs to export!');
            return;
        }

        const data = logs.map(log => ({
            'Timestamp': log.timestamp?.toDate?.()?.toLocaleString() || 'N/A',
            'User Type': log.userType || 'N/A',
            'Action': log.action || 'N/A',
            'User Email': log.userEmail || 'N/A',
            'Organization': organizations.find(o => o.id === log.organizationId)?.name || 'N/A',
            'Details': JSON.stringify(log.details || {}),
            'IP Address': log.ipAddress || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');

        const filename = `audit_logs_${selectedOrg === 'all' ? 'all' : 'filtered'}_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast.success(`Exported ${data.length} audit logs successfully!`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading audit logs...</p>
            </div>
        );
    }

    return (
        <div className="audit-logs-tab">
            <h2>🔍 Audit Logs</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Complete audit trail of all user actions across the platform
            </p>

            {/* Filters */}
            <div className="filters-container">
                <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="filter-input"
                >
                    <option value="all">All User Types</option>
                    <option value="customer">Customers</option>
                    <option value="employee">Employees</option>
                    <option value="orgAdmin">Org Admins</option>
                    <option value="platformAdmin">Platform Admins</option>
                </select>

                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="filter-input"
                >
                    <option value="all">All Actions</option>
                    <option value="booking_created">Booking Created</option>
                    <option value="booking_cancelled">Booking Cancelled</option>
                    <option value="qr_scanned">QR Scanned</option>
                    <option value="token_called">Token Called</option>
                    <option value="service_created">Service Created</option>
                    <option value="service_updated">Service Updated</option>
                </select>

                <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="filter-input"
                    placeholder="Start Date"
                />

                <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="filter-input"
                    placeholder="End Date"
                />

                <button
                    onClick={() => {
                        setActionFilter('all');
                        setUserTypeFilter('all');
                        setDateRange({ start: '', end: '' });
                    }}
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.5rem' }}
                >
                    🔄 Reset Filters
                </button>

                <button
                    onClick={exportToExcel}
                    className="export-btn"
                    style={{ padding: '0.75rem 1.5rem' }}
                >
                    📥 Export to Excel
                </button>
            </div>

            {/* Logs Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User Type</th>
                            <th>Action</th>
                            <th>User Email</th>
                            <th>Organization</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <div className="empty-state-text">No audit logs found</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>
                                        <div style={{ fontSize: '0.875rem' }}>
                                            <div>{log.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                {log.timestamp?.toDate?.()?.toLocaleTimeString() || ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getUserTypeBadge(log.userType)}</td>
                                    <td>{getActionBadge(log.action)}</td>
                                    <td>{log.userEmail || 'N/A'}</td>
                                    <td>
                                        {organizations.find(o => o.id === log.organizationId)?.name || 'N/A'}
                                    </td>
                                    <td>
                                        <small style={{ color: 'var(--text-secondary)' }}>
                                            {JSON.stringify(log.details || {}).substring(0, 50)}...
                                        </small>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Showing {logs.length} log entries
            </div>
        </div>
    );
};

export default AuditLogsTab;
