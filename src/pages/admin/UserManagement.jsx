import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';
import AdvancedTable from '../../components/admin/AdvancedTable';
import { PERMISSION_CODES, DEFAULT_ROLES } from '../../models/permissions';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { logUserAction } from '../../utils/auditLogger';

const UserManagement = () => {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLogs, setUserLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [filters, setFilters] = useState({
        role: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            // Get all users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter only ORG_ADMIN and EMPLOYEE
            const filteredUsers = usersData.filter(user =>
                user.role === 'ORG_ADMIN' || user.role === 'EMPLOYEE'
            );

            // Fetch organization names for users with organizationId
            const orgIds = [...new Set(filteredUsers.map(u => u.organizationId).filter(Boolean))];
            const orgNames = {};

            if (orgIds.length > 0) {
                const orgsSnapshot = await getDocs(collection(db, 'organizations'));
                orgsSnapshot.docs.forEach(doc => {
                    if (orgIds.includes(doc.id)) {
                        orgNames[doc.id] = doc.data().name;
                    }
                });
            }

            // Add organization names to users
            const usersWithOrgNames = filteredUsers.map(user => ({
                ...user,
                organizationName: user.organizationId ? orgNames[user.organizationId] : 'N/A'
            }));

            setUsers(usersWithOrgNames);
            setLoading(false);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
            setLoading(false);
        }
    };

    const loadUserLogs = async (userId) => {
        try {
            const logsQuery = query(
                collection(db, 'auditLogs'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(logsQuery);
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUserLogs(logs);
        } catch (error) {
            console.error('Error loading user logs:', error);
            toast.error('Failed to load user logs');
        }
    };

    const handleViewLogs = async (user) => {
        setSelectedUser(user);
        await loadUserLogs(user.id);
        setShowLogsModal(true);
    };

    const handlePasswordReset = async (user) => {
        if (!user.email) {
            toast.error('User email not found');
            return;
        }

        if (!confirm(`Send password reset email to ${user.email}?`)) return;

        try {
            await sendPasswordResetEmail(auth, user.email);

            // Log the action
            await logUserAction(user.id, 'PASSWORD_RESET_SENT', {
                uid: userProfile.uid,
                name: userProfile.name,
                role: userProfile.role
            });

            toast.success(`Password reset email sent to ${user.email}`);
        } catch (error) {
            console.error('Error sending password reset:', error);
            toast.error('Failed to send password reset email');
        }
    };

    const handleBlockUser = async (userId, userName, currentStatus) => {
        const action = currentStatus ? 'unblock' : 'block';
        if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return;

        try {
            await updateDoc(doc(db, 'users', userId), {
                isBlocked: !currentStatus,
                blockedAt: !currentStatus ? new Date() : null,
                blockedBy: !currentStatus ? userProfile.uid : null
            });

            // Log the action
            await logUserAction(userId, currentStatus ? 'USER_UNBLOCKED' : 'USER_BLOCKED', {
                uid: userProfile.uid,
                name: userProfile.name,
                role: userProfile.role
            });

            toast.success(`User ${action}ed successfully`);
            loadUsers();
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            toast.error(`Failed to ${action} user`);
        }
    };

    const handleChangeRole = async (userId, userName, currentRole) => {
        const newRole = prompt(`Enter new role for ${userName}:\n\nAvailable roles:\n- PLATFORM_ADMIN\n- ORG_ADMIN\n- EMPLOYEE\n- CUSTOMER`, currentRole);

        if (!newRole || newRole === currentRole) return;

        const validRoles = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'EMPLOYEE', 'CUSTOMER'];
        if (!validRoles.includes(newRole)) {
            toast.error('Invalid role. Must be one of: ' + validRoles.join(', '));
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                roleChangedAt: new Date(),
                roleChangedBy: userProfile.uid
            });

            // Log the action
            await logUserAction(userId, 'ROLE_CHANGED', {
                uid: userProfile.uid,
                name: userProfile.name,
                role: userProfile.role
            }, { from: currentRole, to: newRole });

            toast.success(`Role changed from ${currentRole} to ${newRole}`);
            loadUsers();
        } catch (error) {
            console.error('Error changing role:', error);
            toast.error('Failed to change role');
        }
    };

    const getFilteredUsers = () => {
        return users.filter(user => {
            if (filters.role && user.role !== filters.role) return false;
            if (filters.status === 'blocked' && !user.isBlocked) return false;
            if (filters.status === 'active' && user.isBlocked) return false;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                return (
                    user.name?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.phoneNumber?.includes(filters.search)
                );
            }
            return true;
        });
    };

    const userColumns = [
        {
            key: 'name',
            label: 'User',
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: '600' }}>{value || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {row.email || row.phoneNumber}
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Role',
            render: (value) => (
                <span className={`badge badge-${value === 'PLATFORM_ADMIN' ? 'danger' :
                    value === 'ORG_ADMIN' ? 'primary' :
                        value === 'EMPLOYEE' ? 'success' :
                            'secondary'
                    }`}>
                    {value}
                </span>
            )
        },
        {
            key: 'organizationName',
            label: 'Organization',
            render: (value) => value || 'N/A'
        },
        {
            key: 'isBlocked',
            label: 'Status',
            render: (value) => (
                <span className={`badge badge-${value ? 'danger' : 'success'}`}>
                    {value ? 'Blocked' : 'Active'}
                </span>
            )
        },
        {
            key: 'lastLogin',
            label: 'Last Login',
            render: (value) => value?.toDate?.()?.toLocaleDateString() || 'Never'
        }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading users...</p>
            </div>
        );
    }

    const filteredUsers = getFilteredUsers();

    return (
        <PermissionGuard permission={PERMISSION_CODES.PLATFORM_MANAGE_USERS} redirect>
            <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="gradient-text">👥 User Management</h1>
                <p>Manage all users, view logs, and reset passwords</p>

                {/* Statistics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: '2rem'
                }}>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Total Users
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{users.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            Org Admins & Employees
                        </div>
                    </div>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Org Admins
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                            {users.filter(u => u.role === 'ORG_ADMIN').length}
                        </div>
                    </div>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Employees
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                            {users.filter(u => u.role === 'EMPLOYEE').length}
                        </div>
                    </div>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Blocked Users
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>
                            {users.filter(u => u.isBlocked).length}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card-glass" style={{ marginBottom: '2rem' }}>
                    <h3>Filters</h3>
                    <div className="grid grid-cols-1 grid-md-3">
                        <div className="form-group">
                            <label>Role</label>
                            <select
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            >
                                <option value="">All Roles</option>
                                <option value="ORG_ADMIN">Org Admin</option>
                                <option value="EMPLOYEE">Employee</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Search</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Name, email, or phone"
                            />
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="card-glass">
                    <h2>All Users ({filteredUsers.length})</h2>
                    <AdvancedTable
                        data={filteredUsers}
                        columns={userColumns}
                        actions={(row) => (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewLogs(row);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                >
                                    📋 Logs
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePasswordReset(row);
                                    }}
                                    className="btn-primary"
                                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                >
                                    🔑 Reset Password
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleChangeRole(row.id, row.name, row.role);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                >
                                    🔄 Change Role
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBlockUser(row.id, row.name, row.isBlocked);
                                    }}
                                    className={row.isBlocked ? 'btn-success' : 'btn-danger'}
                                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                >
                                    {row.isBlocked ? '✓ Unblock' : '🚫 Block'}
                                </button>
                            </>
                        )}
                        emptyMessage="No users found"
                    />
                </div>

                {/* User Logs Modal */}
                {showLogsModal && (
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
                        padding: 'var(--spacing-lg)'
                    }}>
                        <div className="card-glass" style={{
                            maxWidth: '800px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                <h2>User Activity Logs - {selectedUser?.name}</h2>
                                <button
                                    onClick={() => setShowLogsModal(false)}
                                    className="btn-secondary"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {userLogs.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>No activity logs found for this user</p>
                            ) : (
                                <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                    {userLogs.map(log => (
                                        <div key={log.id} className="glass" style={{ padding: 'var(--spacing-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xs)' }}>
                                                <span className="badge badge-primary">{log.action}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {log.timestamp?.toDate?.()?.toLocaleString()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div><strong>Entity:</strong> {log.entityType}</div>
                                                {log.metadata && (
                                                    <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                                                        <strong>Details:</strong> {JSON.stringify(log.metadata)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PermissionGuard>
    );
};

export default UserManagement;
