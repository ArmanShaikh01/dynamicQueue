import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const OrganizationAnalytics = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        totalServices: 0,
        totalEmployees: 0,
        activeQueues: 0
    });

    useEffect(() => {
        if (userProfile?.organizationId) {
            fetchAnalytics();
        }
    }, [userProfile]);

    const fetchAnalytics = async () => {
        try {
            const orgId = userProfile.organizationId;

            // Fetch appointments
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('organizationId', '==', orgId)
            );
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            const appointments = appointmentsSnapshot.docs.map(doc => doc.data());

            // Fetch services
            const servicesQuery = query(
                collection(db, 'services'),
                where('organizationId', '==', orgId)
            );
            const servicesSnapshot = await getDocs(servicesQuery);

            // Fetch employees
            const employeesQuery = query(
                collection(db, 'users'),
                where('organizationId', '==', orgId),
                where('role', '==', 'EMPLOYEE')
            );
            const employeesSnapshot = await getDocs(employeesQuery);

            // Fetch queues
            const today = new Date().toISOString().split('T')[0];
            const queuesQuery = query(
                collection(db, 'queues'),
                where('organizationId', '==', orgId),
                where('date', '==', today),
                where('isActive', '==', true)
            );
            const queuesSnapshot = await getDocs(queuesQuery);

            setStats({
                totalAppointments: appointments.length,
                completedAppointments: appointments.filter(a => a.status === 'COMPLETED').length,
                cancelledAppointments: appointments.filter(a => a.status === 'CANCELLED').length,
                noShowAppointments: appointments.filter(a => a.status === 'NO_SHOW').length,
                totalServices: servicesSnapshot.size,
                totalEmployees: employeesSnapshot.size,
                activeQueues: queuesSnapshot.size
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <h1>📊 Analytics & Insights</h1>
            <p>Overview of your organization's performance</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {/* Total Appointments */}
                <div className="card" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
                    <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{stats.totalAppointments}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Total Appointments</p>
                </div>

                {/* Completed */}
                <div className="card" style={{ background: 'var(--success-gradient)', color: 'white' }}>
                    <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{stats.completedAppointments}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Completed</p>
                </div>

                {/* Cancelled */}
                <div className="card" style={{ background: 'var(--warning-gradient)', color: 'white' }}>
                    <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{stats.cancelledAppointments}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>Cancelled</p>
                </div>

                {/* No Shows */}
                <div className="card" style={{ background: 'var(--danger-gradient)', color: 'white' }}>
                    <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>{stats.noShowAppointments}</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>No Shows</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Services */}
                <div className="card">
                    <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>{stats.totalServices}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>📋 Active Services</p>
                </div>

                {/* Employees */}
                <div className="card">
                    <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>{stats.totalEmployees}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>👥 Employees</p>
                </div>

                {/* Active Queues */}
                <div className="card">
                    <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>{stats.activeQueues}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>🔄 Active Queues Today</p>
                </div>
            </div>

            {/* Success Rate */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3>Success Rate</h3>
                <div style={{ marginTop: '1rem' }}>
                    {stats.totalAppointments > 0 ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Completion Rate</span>
                                    <strong>{((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)}%</strong>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-full)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${(stats.completedAppointments / stats.totalAppointments) * 100}%`,
                                        height: '100%',
                                        background: 'var(--success-gradient)'
                                    }}></div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>No-Show Rate</span>
                                    <strong>{((stats.noShowAppointments / stats.totalAppointments) * 100).toFixed(1)}%</strong>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-full)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${(stats.noShowAppointments / stats.totalAppointments) * 100}%`,
                                        height: '100%',
                                        background: 'var(--danger-gradient)'
                                    }}></div>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Cancellation Rate</span>
                                    <strong>{((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1)}%</strong>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-full)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${(stats.cancelledAppointments / stats.totalAppointments) * 100}%`,
                                        height: '100%',
                                        background: 'var(--warning-gradient)'
                                    }}></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No appointments data available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationAnalytics;
