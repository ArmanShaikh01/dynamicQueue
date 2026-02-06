import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { PERMISSIONS, DEFAULT_ROLES, PERMISSION_CATEGORIES } from '../../models/permissions';
import { ADMIN_COLLECTIONS } from '../../models/adminSchema';
import { logRoleChange } from '../../utils/auditLogger';
import AdvancedTable from '../../components/admin/AdvancedTable';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { PERMISSION_CODES } from '../../models/permissions';

const RoleManagement = () => {
    const { userProfile } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [],
        scope: 'ORGANIZATION'
    });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const rolesSnapshot = await getDocs(collection(db, ADMIN_COLLECTIONS.ROLES));
            const rolesData = rolesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRoles(rolesData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading roles:', error);
            toast.error('Failed to load roles');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || formData.permissions.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const roleData = {
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
                scope: formData.scope,
                isSystem: false,
                organizationId: formData.scope === 'ORGANIZATION' ? userProfile.organizationId : null,
                createdBy: userProfile.uid,
                updatedAt: serverTimestamp()
            };

            if (editingRole) {
                // Update existing role
                await updateDoc(doc(db, ADMIN_COLLECTIONS.ROLES, editingRole.id), roleData);
                await logRoleChange(editingRole.id, roleData, false, {
                    uid: userProfile.uid,
                    name: userProfile.name,
                    role: userProfile.role
                });
                toast.success('Role updated successfully');
            } else {
                // Create new role
                roleData.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, ADMIN_COLLECTIONS.ROLES), roleData);
                await logRoleChange(docRef.id, roleData, true, {
                    uid: userProfile.uid,
                    name: userProfile.name,
                    role: userProfile.role
                });
                toast.success('Role created successfully');
            }

            handleCancel();
            loadRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error('Failed to save role');
        }
    };

    const handleDelete = async (roleId, roleName) => {
        if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

        try {
            await deleteDoc(doc(db, ADMIN_COLLECTIONS.ROLES, roleId));
            toast.success('Role deleted successfully');
            loadRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('Failed to delete role');
        }
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            scope: role.scope
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingRole(null);
        setFormData({
            name: '',
            description: '',
            permissions: [],
            scope: 'ORGANIZATION'
        });
    };

    const togglePermission = (permissionCode) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionCode)
                ? prev.permissions.filter(p => p !== permissionCode)
                : [...prev.permissions, permissionCode]
        }));
    };

    const getPermissionsByCategory = (category) => {
        return Object.values(PERMISSIONS).filter(p => p.category === category);
    };

    const tableColumns = [
        {
            key: 'name',
            label: 'Role Name',
            render: (value, row) => (
                <div>
                    <strong>{value}</strong>
                    {row.isSystem && <span className="badge badge-primary" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>System</span>}
                </div>
            )
        },
        {
            key: 'description',
            label: 'Description'
        },
        {
            key: 'permissions',
            label: 'Permissions',
            render: (value) => (
                <span className="badge badge-secondary">{value.length} permissions</span>
            ),
            sortable: false
        },
        {
            key: 'scope',
            label: 'Scope',
            render: (value) => <span className="badge">{value}</span>
        }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading roles...</p>
            </div>
        );
    }

    return (
        <PermissionGuard permission={PERMISSION_CODES.PLATFORM_MANAGE_ROLES} redirect>
            <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="gradient-text">🔐 Role Management</h1>
                        <p>Create and manage role templates with permissions</p>
                    </div>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn-primary">
                            + Create Role
                        </button>
                    )}
                </div>

                {showForm ? (
                    <div className="card-glass" style={{ marginBottom: '2rem' }}>
                        <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Role Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Queue Manager"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe what this role can do"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Scope *</label>
                                <select
                                    value={formData.scope}
                                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                >
                                    <option value="PLATFORM">Platform</option>
                                    <option value="ORGANIZATION">Organization</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Permissions * ({formData.permissions.length} selected)</label>
                                <div style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: 'var(--spacing-lg)',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    {Object.values(PERMISSION_CATEGORIES).map(category => {
                                        const categoryPermissions = getPermissionsByCategory(category);
                                        if (categoryPermissions.length === 0) return null;

                                        return (
                                            <div key={category} style={{ marginBottom: 'var(--spacing-lg)' }}>
                                                <h4 style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    marginBottom: 'var(--spacing-sm)',
                                                    color: 'var(--primary)'
                                                }}>
                                                    {category}
                                                </h4>
                                                <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                                    {categoryPermissions.map(permission => (
                                                        <label
                                                            key={permission.code}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                gap: 'var(--spacing-sm)',
                                                                cursor: 'pointer',
                                                                padding: 'var(--spacing-sm)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                background: formData.permissions.includes(permission.code)
                                                                    ? 'rgba(102, 126, 234, 0.1)'
                                                                    : 'transparent'
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(permission.code)}
                                                                onChange={() => togglePermission(permission.code)}
                                                            />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                                                                    {permission.name}
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                    {permission.description}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                                <button type="submit" className="btn-primary">
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                                <button type="button" onClick={handleCancel} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <AdvancedTable
                        data={roles}
                        columns={tableColumns}
                        actions={(row) => (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(row);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                >
                                    ✏️ Edit
                                </button>
                                {!row.isSystem && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(row.id, row.name);
                                        }}
                                        className="btn-danger"
                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
                            </>
                        )}
                        emptyMessage="No roles found. Create your first role to get started."
                    />
                )}
            </div>
        </PermissionGuard>
    );
};

export default RoleManagement;
