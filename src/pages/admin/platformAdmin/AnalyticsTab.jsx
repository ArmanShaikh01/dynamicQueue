import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';

const AnalyticsTab = ({ selectedOrg }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        end: new Date().toISOString().split('T')[0] // Today
    });
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        calculateAnalytics();
    }, [selectedOrg, dateRange]);

    const fetchOrganizations = async () => {
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const orgsData = orgsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        setOrganizations(orgsData);
    };

    const calculateAnalytics = async () => {
        setLoading(true);
        try {
            let appointmentsQuery = collection(db, 'appointments');
            const constraints = [];

            if (selectedOrg !== 'all') {
                constraints.push(where('organizationId', '==', selectedOrg));
            }

            if (dateRange.start) {
                const startDate = Timestamp.fromDate(new Date(dateRange.start));
                constraints.push(where('createdAt', '>=', startDate));
            }

            if (dateRange.end) {
                const endDate = Timestamp.fromDate(new Date(dateRange.end + 'T23:59:59'));
                constraints.push(where('createdAt', '<=', endDate));
            }

            appointmentsQuery = query(appointmentsQuery, ...constraints);
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            const appointments = appointmentsSnapshot.docs.map(doc => doc.data());

            // Calculate metrics
            const totalAppointments = appointments.length;
            const completedAppointments = appointments.filter(a => a.status === 'completed').length;
            const noShowAppointments = appointments.filter(a => a.status === 'no-show').length;
            const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

            // Calculate average waiting time (mock - would need actual data)
            const avgWaitingTime = appointments.length > 0
                ? (appointments.reduce((sum, a) => sum + (a.waitingTime || 15), 0) / appointments.length).toFixed(1)
                : 0;

            // Calculate peak hours
            const peakHours = {};
            appointments.forEach(apt => {
                if (apt.appointmentTime) {
                    const hour = apt.appointmentTime.split(':')[0];
                    peakHours[hour] = (peakHours[hour] || 0) + 1;
                }
            });

            const sortedPeakHours = Object.entries(peakHours)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            setAnalytics({
                totalAppointments,
                completedAppointments,
                noShowAppointments,
                cancelledAppointments,
                avgWaitingTime,
                peakHours: sortedPeakHours,
                completionRate: totalAppointments > 0
                    ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
                    : 0,
                noShowRate: totalAppointments > 0
                    ? ((noShowAppointments / totalAppointments) * 100).toFixed(1)
                    : 0,
            });

            setLoading(false);
        } catch (error) {
            console.error('Error calculating analytics:', error);
            toast.error('Failed to calculate analytics');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Calculating analytics...</p>
            </div>
        );
    }

    return (
        <div className="analytics-tab">
            <h2>📊 Analytics Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {selectedOrg === 'all'
                    ? 'Global analytics across all organizations'
                    : `Analytics for ${organizations.find(o => o.id === selectedOrg)?.name || 'selected organization'}`}
            </p>

            {/* Date Range Filter */}
            <div className="filters-container" style={{ marginBottom: '2rem' }}>
                <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="filter-input"
                />
                <span style={{ padding: '0.75rem' }}>to</span>
                <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="filter-input"
                />
                <button onClick={calculateAnalytics} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                    🔄 Refresh Analytics
                </button>
            </div>

            {/* Key Metrics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Appointments</span>
                        <span className="stat-card-icon">📅</span>
                    </div>
                    <div className="stat-card-value">{analytics?.totalAppointments || 0}</div>
                    <div className="stat-card-subtitle">In selected period</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Completed</span>
                        <span className="stat-card-icon">✅</span>
                    </div>
                    <div className="stat-card-value">{analytics?.completedAppointments || 0}</div>
                    <div className="stat-card-subtitle">{analytics?.completionRate}% completion rate</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">No-Show</span>
                        <span className="stat-card-icon">❌</span>
                    </div>
                    <div className="stat-card-value">{analytics?.noShowAppointments || 0}</div>
                    <div className="stat-card-subtitle">{analytics?.noShowRate}% no-show rate</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Avg Waiting Time</span>
                        <span className="stat-card-icon">⏱️</span>
                    </div>
                    <div className="stat-card-value">{analytics?.avgWaitingTime || 0}</div>
                    <div className="stat-card-subtitle">minutes</div>
                </div>
            </div>

            {/* Peak Hours */}
            <div style={{ marginTop: '3rem' }}>
                <h3>🕐 Peak Booking Hours</h3>
                <div className="data-table-container" style={{ marginTop: '1rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hour</th>
                                <th>Bookings</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics?.peakHours?.length === 0 ? (
                                <tr>
                                    <td colSpan="3">
                                        <div className="empty-state">
                                            <div className="empty-state-text">No data available</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                analytics?.peakHours?.map(([hour, count]) => (
                                    <tr key={hour}>
                                        <td><strong>{hour}:00 - {hour}:59</strong></td>
                                        <td>{count}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    flex: 1,
                                                    height: '8px',
                                                    background: 'var(--border)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${(count / analytics.totalAppointments) * 100}%`,
                                                        height: '100%',
                                                        background: '#667eea'
                                                    }}></div>
                                                </div>
                                                <span>{((count / analytics.totalAppointments) * 100).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status Breakdown */}
            <div style={{ marginTop: '3rem' }}>
                <h3>📊 Status Breakdown</h3>
                <div className="stats-grid" style={{ marginTop: '1rem' }}>
                    <div className="stat-card">
                        <div className="stat-card-title">Completed</div>
                        <div className="stat-card-value" style={{ color: '#10b981' }}>
                            {analytics?.completedAppointments || 0}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-title">No-Show</div>
                        <div className="stat-card-value" style={{ color: '#ef4444' }}>
                            {analytics?.noShowAppointments || 0}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-title">Cancelled</div>
                        <div className="stat-card-value" style={{ color: '#f59e0b' }}>
                            {analytics?.cancelledAppointments || 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
