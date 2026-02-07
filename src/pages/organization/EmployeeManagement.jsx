import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const EmployeeManagement = () => {
    const { userProfile, currentUser } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        name: '',
        phone: '',
        password: '',
        assignedServices: [],
        permissions: ['SCAN_QR', 'MANAGE_QUEUE'],
        isActive: true
    });

    useEffect(() => {
        if (!userProfile?.organizationId) return;

        // Real-time listener for employees
        const employeesQuery = query(
            collection(db, 'users'),
            where('organizationId', '==', userProfile.organizationId),
            where('role', '==', 'EMPLOYEE')
        );

        const unsubscribeEmployees = onSnapshot(employeesQuery,
            (snapshot) => {
                const employeesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEmployees(employeesData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching employees:', error);
                toast.error('Failed to load employees');
                setLoading(false);
            }
        );

        // Real-time listener for services
        const servicesQuery = query(
            collection(db, 'services'),
            where('organizationId', '==', userProfile.organizationId),
            where('isActive', '==', true)
        );

        const unsubscribeServices = onSnapshot(servicesQuery,
            (snapshot) => {
                const servicesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServices(servicesData);
            },
            (error) => {
                console.error('Error fetching services:', error);
            }
        );

        return () => {
            unsubscribeEmployees();
            unsubscribeServices();
        };
    }, [userProfile]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.name) {
            toast.error('Email and name are required');
            return;
        }

        if (!editingEmployee && !formData.password) {
            toast.error('Password is required for new employees');
            return;
        }

        if (!editingEmployee && formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            if (editingEmployee) {
                await updateDoc(doc(db, 'users', editingEmployee.id), {
                    name: formData.name,
                    phone: formData.phone,
                    assignedServices: formData.assignedServices,
                    permissions: formData.permissions,
                    isActive: formData.isActive,
                    updatedAt: serverTimestamp()
                });
                toast.success('Employee updated successfully');
            } else {
                // Store current admin's email to re-authenticate later
                const adminEmail = currentUser.email;

                // We need admin's password to re-login, so we'll use a different approach
                // Create Firebase Auth user with admin-provided password
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );

                const user = userCredential.user;

                // Create user document in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone || '',
                    role: 'EMPLOYEE',
                    assignedServices: formData.assignedServices,
                    permissions: formData.permissions,
                    organizationId: userProfile.organizationId,
                    isActive: formData.isActive,
                    noShowCount: 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Sign out the newly created user to prevent auto-login
                await signOut(auth);

                toast.success('Employee created successfully!');

                // Show alert with credentials
                alert(`Employee Created Successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nShare these credentials with the employee.\n\nIMPORTANT: You have been logged out. Please login again.`);

                // Redirect to login page
                window.location.href = '/login';
            }

            setFormData({
                email: '',
                name: '',
                phone: '',
                password: '',
                assignedServices: [],
                permissions: ['SCAN_QR', 'MANAGE_QUEUE'],
                isActive: true
            });
            setShowForm(false);
            setEditingEmployee(null);
        } catch (error) {
            console.error('Error saving employee:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Email already in use. Please use a different email.');
            } else {
                toast.error('Failed to save employee: ' + error.message);
            }
        }
    };

    const handleEdit = (employee) => {
        setFormData({
            email: employee.email,
            name: employee.name,
            phone: employee.phone || '',
            assignedServices: employee.assignedServices || [],
            permissions: employee.permissions || [],
            isActive: employee.isActive
        });
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleToggleActive = async (employeeId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'users', employeeId), {
                isActive: !currentStatus,
                updatedAt: serverTimestamp()
            });
            toast.success('Employee status updated');
        } catch (error) {
            console.error('Error updating employee:', error);
            toast.error('Failed to update employee');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading employees...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1>Employee Management</h1>
                    <p>Manage your organization's employees</p>
                </div>
                <button
                    className="btn-primary touch-target"
                    onClick={() => setShowForm(!showForm)}
                    style={{ width: '100%' }}
                >
                    {showForm ? 'Cancel' : '+ Add Employee'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={editingEmployee}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Assigned Services</label>
                                <div style={{
                                    display: 'grid',
                                    gap: '0.5rem',
                                    padding: '1rem',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {services.length === 0 ? (
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            No services available. Create services first.
                                        </p>
                                    ) : (
                                        services.map(service => (
                                            <label
                                                key={service.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    transition: 'background var(--transition-base)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assignedServices.includes(service.id)}
                                                    onChange={(e) => {
                                                        const newServices = e.target.checked
                                                            ? [...formData.assignedServices, service.id]
                                                            : formData.assignedServices.filter(id => id !== service.id);
                                                        setFormData({ ...formData, assignedServices: newServices });
                                                    }}
                                                />
                                                <span style={{ fontWeight: '500' }}>{service.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Select which services this employee can manage
                                </small>
                            </div>

                            {!editingEmployee && (
                                <div className="form-group">
                                    <label htmlFor="password">Password *</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Enter password (min 6 characters)"
                                        required
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        This password will be shared with the employee
                                    </small>
                                </div>
                            )}

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="card-footer" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button type="submit" className="btn-primary touch-target" style={{ flex: '1', minWidth: '120px' }}>
                                {editingEmployee ? 'Update Employee' : 'Create Employee'}
                            </button>
                            <button type="button" className="btn-outline touch-target" onClick={() => setShowForm(false)} style={{ flex: '1', minWidth: '120px' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {employees.length === 0 ? (
                <div className="card text-center">
                    <p>No employees found. Add your first employee to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {employees.map(employee => (
                        <div key={employee.id} className="card">
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '0.5rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <h3 style={{ marginBottom: 0, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>{employee.name}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            background: employee.isActive ? '#4facfe' : '#718096',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: 'white'
                                        }}>
                                            {employee.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <p style={{ wordBreak: 'break-word' }}><strong>📧 Email:</strong> {employee.email}</p>
                                        {employee.phone && <p><strong>📞 Phone:</strong> {employee.phone}</p>}
                                        <p style={{ wordBreak: 'break-word' }}><strong>🔑 Permissions:</strong> {employee.permissions?.join(', ')}</p>
                                        <div>
                                            <strong>📋 Assigned Services:</strong>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {employee.assignedServices && employee.assignedServices.length > 0 ? (
                                                    employee.assignedServices.map(serviceId => {
                                                        const service = services.find(s => s.id === serviceId);
                                                        return service ? (
                                                            <span
                                                                key={serviceId}
                                                                style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    background: 'var(--primary-gradient)',
                                                                    borderRadius: 'var(--radius-full)',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600',
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                {service.name}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        No services assigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn-secondary touch-target"
                                        onClick={() => handleEdit(employee)}
                                        style={{ flex: '1', minWidth: '100px', padding: '0.75rem 1rem' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={`${employee.isActive ? 'btn-danger' : 'btn-success'} touch-target`}
                                        onClick={() => handleToggleActive(employee.id, employee.isActive)}
                                        style={{ flex: '1', minWidth: '100px', padding: '0.75rem 1rem' }}
                                    >
                                        {employee.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;
