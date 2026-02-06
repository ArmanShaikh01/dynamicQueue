import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import StatCard from '../../components/admin/StatCard';
import AdvancedTable from '../../components/admin/AdvancedTable';
import { getPlatformStats } from '../../utils/analytics';
import { logOrgApproval, logOrgSuspension } from '../../utils/auditLogger';
import { PERMISSION_CODES } from '../../models/permissions';
import PermissionGuard from '../../components/admin/PermissionGuard';

const PlatformDashboard = () => {
    const { userProfile } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [stats, setStats] = useState(null);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Load platform statistics
    useEffect(() => {
        const loadStats = async () => {
            try {
                const platformStats = await getPlatformStats();
                setStats(platformStats);
                setStatsLoading(false);
            } catch (error) {
                console.error('Error loading stats:', error);
                toast.error('Failed to load statistics');
                setStatsLoading(false);
            }
        };

        loadStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Real-time listener for organizations
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'organizations'),
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

    const handleApprove = async (orgId, orgName) => {
        try {
            await updateDoc(doc(db, 'organizations', orgId), {
                isApproved: true,
                isActive: true,
                approvedAt: new Date(),
                approvedBy: userProfile.uid
            });

            // Log audit action
            await logOrgApproval(orgId, orgName, {
                uid: userProfile.uid,
                name: userProfile.name,
                role: userProfile.role
            });

            toast.success('Organization approved successfully');
        } catch (error) {
            console.error('Error approving organization:', error);
            toast.error('Failed to approve organization');
        }
    };

    const handleSuspend = async (orgId, orgName) => {
        const reason = prompt('Enter suspension reason:');
        if (!reason) return;

        try {
            await updateDoc(doc(db, 'organizations', orgId), {
                isActive: false,
                suspendedAt: new Date(),
                suspendedBy: userProfile.uid,
                suspensionReason: reason
            });

            // Log audit action
            await logOrgSuspension(orgId, orgName, reason, {
                uid: userProfile.uid,
                name: userProfile.name,
                role: userProfile.role
            });

            toast.success('Organization suspended successfully');
        } catch (error) {
            console.error('Error suspending organization:', error);
            toast.error('Failed to suspend organization');
        }
    };

    const handleReactivate = async (orgId) => {
        try {
            await updateDoc(doc(db, 'organizations', orgId), {
                isActive: true,
                suspendedAt: null,
                suspendedBy: null,
                suspensionReason: null
            });

            toast.success('Organization reactivated successfully');
        } catch (error) {
            console.error('Error reactivating organization:', error);
            toast.error('Failed to reactivate organization');
        }
    };

    const getFilteredOrganizations = () => {
        switch (filter) {
            case 'pending':
                return organizations.filter(org => !org.isApproved);
            case 'approved':
                return organizations.filter(org => org.isApproved && org.isActive);
            case 'suspended':
                return organizations.filter(org => !org.isActive);
            default:
                return organizations;
        }
    };

    const getStatusBadge = (org) => {
        if (!org.isApproved) {
            return <span className="badge badge-warning">Pending</span>;
        }
        if (!org.isActive) {
            return <span className="badge badge-danger">Suspended</span>;
        }
        return <span className="badge badge-success">Active</span>;
    };

    const tableColumns = [
        {
            key: 'name',
            label: 'Organization Name',
            render: (value) => <strong>{value}</strong>
        },
        {
            key: 'type',
            label: 'Type',
            render: (value) => value.replace('_', ' ').toUpperCase()
        },
        {
            key: 'contact',
            label: 'Contact',
            render: (value) => (
                <div style={{ fontSize: '0.875rem' }}>
                    <div>{value.email}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{value.phone}</div>
                </div>
            ),
            sortable: false
        },
        {
            key: 'createdAt',
            label: 'Created',
            render: (value) => value?.toDate?.()?.toLocaleDateString() || 'N/A'
        },
        {
            key: 'isApproved',
            label: 'Status',
            render: (value, row) => getStatusBadge(row),
            sortable: false
        }
    ];

    if (loading || statsLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const filteredOrgs = getFilteredOrganizations();

    return (
        <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <h1 className="gradient-text">👥 Platform Dashboard</h1>
            <p>Manage organizations and view platform analytics</p>

            {/* Statistics Cards */}
            <PermissionGuard permission={PERMISSION_CODES.PLATFORM_VIEW_ANALYTICS}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: '2rem'
                }}>
                    <StatCard
                        title="Total Organizations"
                        value={stats?.totalOrgs || 0}
                        breakdown={{
                            Approved: stats?.approvedOrgs || 0,
                            Pending: stats?.pendingOrgs || 0
                        }}
                        icon="🏢"
                    />
                    <StatCard
                        title="Active Today"
                        value={stats?.activeOrgs || 0}
                        subtitle="Organizations"
                        icon="✅"
                        realtime
                    />
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        breakdown={{
                            Customers: stats?.customers || 0,
                            Employees: stats?.employees || 0
                        }}
                        icon="👥"
                    />
                    <StatCard
                        title="Appointments Today"
                        value={stats?.appointmentsToday || 0}
                        subtitle={`${stats?.appointmentsMonth || 0} this month`}
                        icon="📅"
                        realtime
                    />
                </div>
            </PermissionGuard>

            {/* Organization Management */}
            <PermissionGuard permission={PERMISSION_CODES.PLATFORM_MANAGE_ORGS}>
                <div style={{ marginTop: '2rem' }}>
                    <h2>Organization Management</h2>

                    {/* Filter Tabs */}
                    <div className="scroll-x" style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        borderBottom: '2px solid var(--border)',
                        overflowX: 'auto'
                    }}>
                        {['pending', 'approved', 'suspended', 'all'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className="touch-target"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: filter === tab ? '2px solid #667eea' : '2px solid transparent',
                                    color: filter === tab ? '#667eea' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: filter === tab ? '600' : '400',
                                    textTransform: 'capitalize',
                                    marginBottom: '-2px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tab} ({
                                    tab === 'pending' ? stats?.pendingOrgs :
                                        tab === 'approved' ? stats?.approvedOrgs :
                                            tab === 'suspended' ? (stats?.totalOrgs - stats?.activeOrgs) :
                                                stats?.totalOrgs
                                })
                            </button>
                        ))}
                    </div>

                    {/* Organizations Table */}
                    <AdvancedTable
                        data={filteredOrgs}
                        columns={tableColumns}
                        actions={(row) => (
                            <>
                                {!row.isApproved && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprove(row.id, row.name);
                                        }}
                                        className="btn-success"
                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                    >
                                        ✓ Approve
                                    </button>
                                )}
                                {row.isActive && row.isApproved && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSuspend(row.id, row.name);
                                        }}
                                        className="btn-danger"
                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                    >
                                        ⊗ Suspend
                                    </button>
                                )}
                                {!row.isActive && row.isApproved && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReactivate(row.id);
                                        }}
                                        className="btn-success"
                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                    >
                                        ↻ Reactivate
                                    </button>
                                )}
                            </>
                        )}
                        emptyMessage={`No ${filter !== 'all' ? filter : ''} organizations found`}
                    />
                </div>
            </PermissionGuard>
        </div>
    );
};

export default PlatformDashboard;
