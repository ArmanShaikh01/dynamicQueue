import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';

const OrganizationsTab = ({ setSelectedOrg }) => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrgDetails, setSelectedOrgDetails] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'organizations'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const orgsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOrganizations(orgsData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching organizations:', error);
                toast.error('Failed to load organizations');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const getFilteredOrganizations = () => {
        return organizations.filter(org => {
            const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                org.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && org.isActive && org.isApproved) ||
                (statusFilter === 'pending' && !org.isApproved) ||
                (statusFilter === 'suspended' && !org.isActive);

            return matchesSearch && matchesStatus;
        });
    };

    const getStatusBadge = (org) => {
        if (!org.isApproved) {
            return <span className="badge badge-warning">⏳ Pending</span>;
        }
        if (!org.isActive) {
            return <span className="badge badge-danger">⊗ Suspended</span>;
        }
        return <span className="badge badge-success">✓ Active</span>;
    };

    const getStats = () => {
        return {
            total: organizations.length,
            active: organizations.filter(o => o.isActive && o.isApproved).length,
            pending: organizations.filter(o => !o.isApproved).length,
            suspended: organizations.filter(o => !o.isActive).length,
        };
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading organizations...</p>
            </div>
        );
    }

    const filteredOrgs = getFilteredOrganizations();
    const stats = getStats();

    return (
        <div className="organizations-tab">
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Organizations</span>
                        <span className="stat-card-icon">🏢</span>
                    </div>
                    <div className="stat-card-value">{stats.total}</div>
                    <div className="stat-card-subtitle">All registered organizations</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Active</span>
                        <span className="stat-card-icon">✅</span>
                    </div>
                    <div className="stat-card-value">{stats.active}</div>
                    <div className="stat-card-subtitle">Approved & operational</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Pending Approval</span>
                        <span className="stat-card-icon">⏳</span>
                    </div>
                    <div className="stat-card-value">{stats.pending}</div>
                    <div className="stat-card-subtitle">Awaiting review</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Suspended</span>
                        <span className="stat-card-icon">⊗</span>
                    </div>
                    <div className="stat-card-value">{stats.suspended}</div>
                    <div className="stat-card-subtitle">Temporarily disabled</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-container">
                <input
                    type="text"
                    placeholder="🔍 Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-input"
                    style={{ flex: '0 0 200px' }}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Organizations Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Type</th>
                            <th>Contact</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrgs.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📭</div>
                                        <div className="empty-state-text">No organizations found</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredOrgs.map(org => (
                                <tr key={org.id}>
                                    <td>
                                        <strong>{org.name}</strong>
                                    </td>
                                    <td>
                                        {org.type?.replace('_', ' ').toUpperCase() || 'N/A'}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.875rem' }}>
                                            <div>{org.contact?.email || 'N/A'}</div>
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                {org.contact?.phone || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {org.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                    </td>
                                    <td>{getStatusBadge(org)}</td>
                                    <td>
                                        <button
                                            onClick={() => setSelectedOrgDetails(org)}
                                            className="btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                        >
                                            👁️ View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Organization Details Modal */}
            {selectedOrgDetails && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }} onClick={() => setSelectedOrgDetails(null)}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        border: '2px solid var(--border)'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>🏢 Organization Details</h2>
                            <button
                                onClick={() => setSelectedOrgDetails(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Organization Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Organization Name</label>
                                <div style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{selectedOrgDetails.name}</div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Type</label>
                                <div style={{ marginTop: '0.25rem' }}>{selectedOrgDetails.type?.replace('_', ' ').toUpperCase() || 'N/A'}</div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status</label>
                                <div style={{ marginTop: '0.25rem' }}>{getStatusBadge(selectedOrgDetails)}</div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Contact Email</label>
                                <div style={{ marginTop: '0.25rem' }}>{selectedOrgDetails.contact?.email || 'N/A'}</div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Contact Number</label>
                                <div style={{ marginTop: '0.25rem' }}>{selectedOrgDetails.contact?.phone || 'N/A'}</div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Address</label>
                                <div style={{ marginTop: '0.25rem' }}>{selectedOrgDetails.address || 'N/A'}</div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Created At</label>
                                <div style={{ marginTop: '0.25rem' }}>
                                    {selectedOrgDetails.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                </div>
                            </div>

                            {selectedOrgDetails.description && (
                                <div>
                                    <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Description</label>
                                    <div style={{ marginTop: '0.25rem' }}>{selectedOrgDetails.description}</div>
                                </div>
                            )}

                            {!selectedOrgDetails.isActive && selectedOrgDetails.suspensionReason && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '2px solid #ef4444',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: '1rem'
                                }}>
                                    <label style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.875rem' }}>Suspension Reason</label>
                                    <div style={{ marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                                        {selectedOrgDetails.suspensionReason}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setSelectedOrg(selectedOrgDetails.id);
                                    setSelectedOrgDetails(null);
                                }}
                                className="btn-primary"
                                style={{ padding: '0.75rem 1.5rem' }}
                            >
                                🔍 Filter by This Organization
                            </button>
                            <button
                                onClick={() => setSelectedOrgDetails(null)}
                                className="btn-secondary"
                                style={{ padding: '0.75rem 1.5rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationsTab;
