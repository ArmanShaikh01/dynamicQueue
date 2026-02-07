import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StatCard from '../../components/admin/StatCard';
import { getOrganizationStats } from '../../utils/analytics';
import { PERMISSION_CODES } from '../../models/permissions';
import PermissionGuard from '../../components/admin/PermissionGuard';

const OrganizationDashboard = () => {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load organization statistics
    useEffect(() => {
        if (!userProfile?.organizationId) return;

        const loadStats = async () => {
            try {
                const orgStats = await getOrganizationStats(userProfile.organizationId);
                setStats(orgStats);
            } catch (error) {
                console.error('Error loading stats:', error);
                toast.error('Failed to load statistics');
            }
        };

        loadStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [userProfile?.organizationId]);

    // Real-time listener for employees
    useEffect(() => {
        if (!userProfile?.organizationId) return;

        const unsubscribe = onSnapshot(
            query(
                collection(db, 'users'),
                where('organizationId', '==', userProfile.organizationId),
                where('role', '==', 'EMPLOYEE')
            ),
            (snapshot) => {
                const employeesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEmployees(employeesData);
            },
            (error) => {
                console.error('Error fetching employees:', error);
            }
        );

        return () => unsubscribe();
    }, [userProfile?.organizationId]);

    // Real-time listener for services
    useEffect(() => {
        if (!userProfile?.organizationId) return;

        const unsubscribe = onSnapshot(
            query(
                collection(db, 'services'),
                where('organizationId', '==', userProfile.organizationId)
            ),
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

        return () => unsubscribe();
    }, [userProfile?.organizationId]);

    // Real-time listener for today's appointments
    useEffect(() => {
        if (!userProfile?.organizationId) return;

        const today = new Date().toISOString().split('T')[0];

        const unsubscribe = onSnapshot(
            query(
                collection(db, 'appointments'),
                where('organizationId', '==', userProfile.organizationId),
                where('appointmentDate', '==', today)
            ),
            (snapshot) => {
                const appointmentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTodayAppointments(appointmentsData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching appointments:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userProfile?.organizationId]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const activeServices = services.filter(s => s.isActive);
    const activeEmployees = employees.filter(e => e.isActive);

    return (
        <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <h1 className="gradient-text">🏢 Organization Dashboard</h1>
            <p>Monitor your organization's performance and operations</p>

            {/* Real-time Statistics */}
            <PermissionGuard permission={PERMISSION_CODES.ORG_VIEW_DASHBOARD}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: '2rem'
                }}>
                    <StatCard
                        title="Today's Appointments"
                        value={stats?.appointmentsToday || 0}
                        breakdown={{
                            Completed: stats?.completed || 0,
                            'In Progress': stats?.inProgress || 0,
                            Pending: stats?.pending || 0
                        }}
                        icon="📅"
                        realtime
                    />
                    <StatCard
                        title="Active Queue Length"
                        value={stats?.queueLength || 0}
                        subtitle="Customers waiting"
                        icon="👥"
                        realtime
                        pulse
                        alert={stats?.queueLength > 10}
                    />
                    <StatCard
                        title="Avg Wait Time"
                        value={`${stats?.avgWait || 0} min`}
                        trend={stats?.waitTrend}
                        icon="⏱️"
                        realtime
                    />
                    <StatCard
                        title="No-Shows Today"
                        value={stats?.noShows || 0}
                        subtitle={`${stats?.appointmentsToday > 0 ? Math.round((stats?.noShows / stats?.appointmentsToday) * 100) : 0}% rate`}
                        icon="❌"
                        alert={stats?.noShows > 5}
                    />
                </div>
            </PermissionGuard>

            {/* Quick Actions */}
            <div className="card-glass" style={{ marginBottom: '2rem' }}>
                <h2>Quick Actions</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)'
                }}>
                    <PermissionGuard permission={PERMISSION_CODES.ORG_MANAGE_SERVICES}>
                        <Link to="/organization/services" className="btn-primary" style={{ textAlign: 'center' }}>
                            🛠️ Manage Services
                        </Link>
                    </PermissionGuard>
                    <PermissionGuard permission={PERMISSION_CODES.ORG_MANAGE_EMPLOYEES}>
                        <Link to="/organization/employees" className="btn-primary" style={{ textAlign: 'center' }}>
                            👥 Manage Employees
                        </Link>
                    </PermissionGuard>
                    <PermissionGuard permission={PERMISSION_CODES.ORG_VIEW_ANALYTICS}>
                        <Link to="/organization/analytics" className="btn-primary" style={{ textAlign: 'center' }}>
                            📊 View Analytics
                        </Link>
                    </PermissionGuard>
                    <PermissionGuard permission={PERMISSION_CODES.ORG_MANAGE_QUEUE}>
                        <Link to="/organization/queue-monitor" className="btn-primary" style={{ textAlign: 'center' }}>
                            📺 Live Queue Monitor
                        </Link>
                    </PermissionGuard>
                </div>
            </div>

            {/* Staff Availability */}
            <div className="card-glass" style={{ marginBottom: '2rem' }}>
                <h2>Staff Availability</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--spacing-md)'
                }}>
                    <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Total Employees
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{employees.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            {activeEmployees.length} active
                        </div>
                    </div>
                    <div className="glass" style={{ padding: 'var(--spacing-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Active Services
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{activeServices.length}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            of {services.length} total
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Appointments Overview */}
            <div className="card-glass">
                <h2>Today's Appointments</h2>
                {todayAppointments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No appointments scheduled for today</p>
                ) : (
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        {/* Status breakdown */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'rgba(74, 222, 128, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                                    {todayAppointments.filter(a => a.status === 'COMPLETED').length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    {todayAppointments.filter(a => a.status === 'IN_PROGRESS').length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In Progress</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                                    {todayAppointments.filter(a => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                                    {todayAppointments.filter(a => a.status === 'NO_SHOW').length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No-Show</div>
                            </div>
                        </div>

                        {/* Recent appointments */}
                        <div>
                            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Recent Activity</h3>
                            <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                {todayAppointments.slice(0, 5).map(appointment => (
                                    <div
                                        key={appointment.id}
                                        className="glass"
                                        style={{
                                            padding: 'var(--spacing-sm)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                {appointment.customerName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {appointment.serviceName} • {appointment.appointmentTime}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${appointment.status === 'COMPLETED' ? 'success' :
                                            appointment.status === 'IN_PROGRESS' ? 'primary' :
                                                appointment.status === 'NO_SHOW' ? 'danger' :
                                                    'warning'
                                            }`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationDashboard;
