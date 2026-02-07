import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchOrgAnalytics } from '../../services/analyticsService';
import { exportAnalyticsToExcel, exportAnalyticsToPDF } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../../../src/styles/Analytics.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

const OrgAnalyticsDashboard = () => {
    const { userProfile } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [filters, setFilters] = useState({
        service: '',
        status: ''
    });

    useEffect(() => {
        if (userProfile?.organizationId) {
            loadAnalytics();
        }
    }, [userProfile, dateRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await fetchOrgAnalytics(userProfile.organizationId, dateRange);
            setAnalytics(data);
            console.log('📊 Analytics loaded:', data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error('Failed to load analytics');
        }
        setLoading(false);
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const result = await exportAnalyticsToExcel(analytics, userProfile.organizationName || 'Organization');
            if (result.success) {
                toast.success(`Exported to ${result.filename}`);
            } else {
                toast.error('Failed to export to Excel');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export to Excel');
        }
        setExporting(false);
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const result = await exportAnalyticsToPDF(analytics, userProfile.organizationName || 'Organization');
            if (result.success) {
                toast.success(`Exported to ${result.filename}`);
            } else {
                toast.error('Failed to export to PDF');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export to PDF');
        }
        setExporting(false);
    };

    if (loading) {
        return (
            <div className="analytics-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="analytics-container">
                <div className="empty-state">
                    <p>No analytics data available</p>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const serviceChartData = analytics.serviceWise.map(s => ({
        name: s.serviceName,
        value: s.total
    }));

    const servicePerformanceData = analytics.serviceWise.map(s => ({
        name: s.serviceName,
        Completed: s.completed,
        Cancelled: s.cancelled,
        'No-Shows': s.noShows
    }));

    const staffChartData = analytics.staffWise.map(s => ({
        name: s.staffName,
        Bookings: s.total,
        Completed: s.completed
    }));

    const cancellationData = Object.entries(analytics.cancellationReasons).map(([reason, count]) => ({
        name: reason,
        value: count
    }));

    const noShowData = Object.entries(analytics.noShowReasons).map(([reason, count]) => ({
        name: reason,
        value: count
    }));

    return (
        <div className="analytics-container">
            {/* Header */}
            <div className="analytics-header">
                <div>
                    <h1>📊 Analytics Dashboard</h1>
                    <p>Organization: {userProfile.organizationName || 'Your Organization'}</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleExportExcel}
                        disabled={exporting}
                    >
                        📥 Export Excel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExportPDF}
                        disabled={exporting}
                    >
                        📄 Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card-glass" style={{ marginBottom: '2rem' }}>
                <h3>Filters</h3>
                <div className="grid grid-cols-1 grid-md-3">
                    <div className="form-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <button className="btn btn-primary" onClick={loadAnalytics} style={{ marginTop: '1.5rem' }}>
                            🔍 Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon">📅</div>
                    <div className="summary-content">
                        <div className="summary-label">Total Bookings</div>
                        <div className="summary-value">{analytics.summary.totalBookings}</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">✅</div>
                    <div className="summary-content">
                        <div className="summary-label">Completed</div>
                        <div className="summary-value">{analytics.summary.completed}</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">❌</div>
                    <div className="summary-content">
                        <div className="summary-label">Cancelled</div>
                        <div className="summary-value">{analytics.summary.cancelled}</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">👻</div>
                    <div className="summary-content">
                        <div className="summary-label">No-Shows</div>
                        <div className="summary-value">{analytics.summary.noShows}</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">⏱️</div>
                    <div className="summary-content">
                        <div className="summary-label">Avg Wait Time</div>
                        <div className="summary-value">{analytics.summary.avgWaitingTime} min</div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">🚨</div>
                    <div className="summary-content">
                        <div className="summary-label">Emergency Cases</div>
                        <div className="summary-value">{analytics.summary.emergencyCases}</div>
                    </div>
                </div>
            </div>

            {/* Service-wise Analytics */}
            <div className="card-glass" style={{ marginTop: '2rem' }}>
                <h2>Service-wise Analytics</h2>
                <div className="charts-grid">
                    {/* Pie Chart - Bookings by Service */}
                    <div className="chart-container">
                        <h3>Bookings by Service</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={serviceChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {serviceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart - Service Performance */}
                    <div className="chart-container">
                        <h3>Service Performance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={servicePerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Completed" fill="#43e97b" />
                                <Bar dataKey="Cancelled" fill="#fa709a" />
                                <Bar dataKey="No-Shows" fill="#f093fb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Table */}
                <div className="table-responsive" style={{ marginTop: '2rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Service Name</th>
                                <th>Total</th>
                                <th>Completed</th>
                                <th>Cancelled</th>
                                <th>No-Shows</th>
                                <th>Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.serviceWise.map((service, index) => (
                                <tr key={index}>
                                    <td>{service.serviceName}</td>
                                    <td>{service.total}</td>
                                    <td>{service.completed}</td>
                                    <td>{service.cancelled}</td>
                                    <td>{service.noShows}</td>
                                    <td>{service.pending}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff-wise Analytics */}
            {analytics.staffWise.length > 0 && (
                <div className="card-glass" style={{ marginTop: '2rem' }}>
                    <h2>Staff-wise Performance</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={staffChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Bookings" fill="#667eea" />
                                <Bar dataKey="Completed" fill="#43e97b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Staff Table */}
                    <div className="table-responsive" style={{ marginTop: '2rem' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Staff Name</th>
                                    <th>Total Bookings</th>
                                    <th>Completed</th>
                                    <th>Cancelled</th>
                                    <th>No-Shows</th>
                                    <th>Avg Wait Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.staffWise.map((staff, index) => (
                                    <tr key={index}>
                                        <td>{staff.staffName}</td>
                                        <td>{staff.total}</td>
                                        <td>{staff.completed}</td>
                                        <td>{staff.cancelled}</td>
                                        <td>{staff.noShows}</td>
                                        <td>{staff.avgWaitingTime} min</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Trends Over Time */}
            {analytics.trends.length > 0 && (
                <div className="card-glass" style={{ marginTop: '2rem' }}>
                    <h2>Trends Over Time</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics.trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="total" stackId="1" stroke="#667eea" fill="#667eea" />
                                <Area type="monotone" dataKey="completed" stackId="2" stroke="#43e97b" fill="#43e97b" />
                                <Area type="monotone" dataKey="cancelled" stackId="3" stroke="#fa709a" fill="#fa709a" />
                                <Area type="monotone" dataKey="noShows" stackId="4" stroke="#f093fb" fill="#f093fb" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Cancellation & No-Show Analysis */}
            <div className="card-glass" style={{ marginTop: '2rem' }}>
                <h2>Cancellation & No-Show Analysis</h2>
                <div className="charts-grid">
                    {/* Cancellation Reasons */}
                    {cancellationData.length > 0 && (
                        <div className="chart-container">
                            <h3>Cancellation Reasons</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={cancellationData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {cancellationData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* No-Show Reasons */}
                    {noShowData.length > 0 && (
                        <div className="chart-container">
                            <h3>No-Show Reasons</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={noShowData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {noShowData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrgAnalyticsDashboard;
