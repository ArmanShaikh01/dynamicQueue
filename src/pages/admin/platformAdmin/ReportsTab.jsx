import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportsTab = ({ selectedOrg }) => {
    const [organizations, setOrganizations] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const orgsData = orgsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        setOrganizations(orgsData);
    };

    const getOrgName = () => {
        if (selectedOrg === 'all') return 'All_Organizations';
        return organizations.find(o => o.id === selectedOrg)?.name || 'Unknown';
    };

    // Export Customers Report
    const exportCustomersExcel = async () => {
        setGenerating(true);
        try {
            console.log('📊 Exporting customers for org:', selectedOrg);

            let q = collection(db, 'users');
            q = query(q, where('role', '==', 'CUSTOMER'));

            if (selectedOrg !== 'all') {
                q = query(q, where('organizationId', '==', selectedOrg));
            }

            const snapshot = await getDocs(q);
            console.log('👥 Customers found:', snapshot.docs.length);

            if (snapshot.docs.length === 0) {
                toast.error('No customers found for the selected filters!');
                setGenerating(false);
                return;
            }

            const customers = snapshot.docs.map(doc => ({
                'Name': doc.data().name || 'N/A',
                'Email': doc.data().email || 'N/A',
                'Phone': doc.data().phone || 'N/A',
                'Organization': organizations.find(o => o.id === doc.data().organizationId)?.name || 'N/A',
                'Joined Date': doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(customers);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Customers');

            XLSX.writeFile(wb, `Customers_Report_${getOrgName()}_${Date.now()}.xlsx`);
            toast.success(`Exported ${customers.length} customers successfully!`);
        } catch (error) {
            console.error('Error exporting customers:', error);
            toast.error('Failed to export customers report');
        }
        setGenerating(false);
    };

    // Export Employees Report
    const exportEmployeesExcel = async () => {
        setGenerating(true);
        try {
            console.log('📊 Exporting employees for org:', selectedOrg);

            let q = collection(db, 'users');
            q = query(q, where('role', 'in', ['EMPLOYEE', 'ORG_ADMIN']));

            if (selectedOrg !== 'all') {
                q = query(q, where('organizationId', '==', selectedOrg));
            }

            const snapshot = await getDocs(q);
            console.log('👔 Employees found:', snapshot.docs.length);

            if (snapshot.docs.length === 0) {
                toast.error('No employees found for the selected filters!');
                setGenerating(false);
                return;
            }
            const employees = snapshot.docs.map(doc => ({
                'Name': doc.data().name || 'N/A',
                'Email': doc.data().email || 'N/A',
                'Phone': doc.data().phone || 'N/A',
                'Role': doc.data().role?.toUpperCase() || 'N/A',
                'Organization': organizations.find(o => o.id === doc.data().organizationId)?.name || 'N/A',
                'Joined Date': doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(employees);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Employees');

            XLSX.writeFile(wb, `Employees_Report_${getOrgName()}_${Date.now()}.xlsx`);
            toast.success(`Exported ${employees.length} employees successfully!`);
        } catch (error) {
            console.error('Error exporting employees:', error);
            toast.error('Failed to export employees report');
        }
        setGenerating(false);
    };

    // Export Appointments Report
    const exportAppointmentsExcel = async () => {
        setGenerating(true);
        try {
            let q = collection(db, 'appointments');
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

            q = query(q, ...constraints);
            const snapshot = await getDocs(q);
            const appointments = snapshot.docs.map(doc => ({
                'Token Number': doc.data().tokenNumber || 'N/A',
                'Customer Name': doc.data().customerName || 'N/A',
                'Service': doc.data().serviceName || 'N/A',
                'Date': doc.data().appointmentDate || 'N/A',
                'Time': doc.data().appointmentTime || 'N/A',
                'Status': doc.data().status?.toUpperCase() || 'N/A',
                'Organization': organizations.find(o => o.id === doc.data().organizationId)?.name || 'N/A',
                'Created At': doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(appointments);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

            XLSX.writeFile(wb, `Appointments_Report_${getOrgName()}_${dateRange.start}_to_${dateRange.end}.xlsx`);
            toast.success('Appointments report exported successfully!');
        } catch (error) {
            console.error('Error exporting appointments:', error);
            toast.error('Failed to export appointments report');
        }
        setGenerating(false);
    };

    // Export Analytics PDF
    const exportAnalyticsPDF = async () => {
        setGenerating(true);
        try {
            // Fetch analytics data
            let q = collection(db, 'appointments');
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

            q = query(q, ...constraints);
            const snapshot = await getDocs(q);
            const appointments = snapshot.docs.map(doc => doc.data());

            const totalAppointments = appointments.length;
            const completedAppointments = appointments.filter(a => a.status === 'completed').length;
            const noShowAppointments = appointments.filter(a => a.status === 'no-show').length;
            const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

            // Generate PDF
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text('Analytics Report', 14, 20);

            doc.setFontSize(12);
            doc.text(`Organization: ${getOrgName()}`, 14, 30);
            doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 37);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

            const tableData = [
                ['Metric', 'Value'],
                ['Total Appointments', totalAppointments.toString()],
                ['Completed', completedAppointments.toString()],
                ['No-Show', noShowAppointments.toString()],
                ['Cancelled', cancelledAppointments.toString()],
                ['Completion Rate', `${((completedAppointments / totalAppointments) * 100).toFixed(1)}%`],
                ['No-Show Rate', `${((noShowAppointments / totalAppointments) * 100).toFixed(1)}%`]
            ];

            autoTable(doc, {
                startY: 55,
                head: [tableData[0]],
                body: tableData.slice(1),
                theme: 'grid',
                headStyles: { fillColor: [102, 126, 234] }
            });

            doc.save(`Analytics_Report_${getOrgName()}_${Date.now()}.pdf`);
            toast.success('Analytics report exported successfully!');
        } catch (error) {
            console.error('Error exporting analytics:', error);
            toast.error('Failed to export analytics report');
        }
        setGenerating(false);
    };

    return (
        <div className="reports-tab">
            <h2>📄 Reports & Exports</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Generate and download comprehensive reports in Excel and PDF formats
            </p>

            {/* Date Range Filter */}
            <div className="filters-container" style={{ marginBottom: '3rem' }}>
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
            </div>

            {/* Report Cards */}
            <div className="stats-grid">
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={exportCustomersExcel}>
                    <div className="stat-card-header">
                        <span className="stat-card-title">Customers Report</span>
                        <span className="stat-card-icon">👥</span>
                    </div>
                    <div className="stat-card-subtitle" style={{ marginTop: '1rem' }}>
                        Export complete customer list with contact details and organization info
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); exportCustomersExcel(); }}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={generating}
                    >
                        📥 Export Excel
                    </button>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={exportEmployeesExcel}>
                    <div className="stat-card-header">
                        <span className="stat-card-title">Employees Report</span>
                        <span className="stat-card-icon">👔</span>
                    </div>
                    <div className="stat-card-subtitle" style={{ marginTop: '1rem' }}>
                        Export employee list with roles, assignments, and activity data
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); exportEmployeesExcel(); }}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={generating}
                    >
                        📥 Export Excel
                    </button>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={exportAppointmentsExcel}>
                    <div className="stat-card-header">
                        <span className="stat-card-title">Appointments Report</span>
                        <span className="stat-card-icon">📅</span>
                    </div>
                    <div className="stat-card-subtitle" style={{ marginTop: '1rem' }}>
                        Export appointment history with status, dates, and customer info
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); exportAppointmentsExcel(); }}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={generating}
                    >
                        📥 Export Excel
                    </button>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={exportAnalyticsPDF}>
                    <div className="stat-card-header">
                        <span className="stat-card-title">Analytics Summary</span>
                        <span className="stat-card-icon">📊</span>
                    </div>
                    <div className="stat-card-subtitle" style={{ marginTop: '1rem' }}>
                        Export comprehensive analytics summary with key metrics
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); exportAnalyticsPDF(); }}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={generating}
                    >
                        📥 Export PDF
                    </button>
                </div>
            </div>

            {generating && (
                <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>Generating report...</p>
                </div>
            )}

            {/* Info Box */}
            <div style={{
                marginTop: '3rem',
                padding: '1.5rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border)'
            }}>
                <h3 style={{ marginTop: 0 }}>ℹ️ Report Information</h3>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li>All reports respect the current organization filter</li>
                    <li>Date range applies to appointments and analytics reports</li>
                    <li>Excel reports include all available data fields</li>
                    <li>PDF reports provide a summary view with key metrics</li>
                    <li>Reports are generated on-demand and may take a few seconds</li>
                </ul>
            </div>
        </div>
    );
};

export default ReportsTab;
