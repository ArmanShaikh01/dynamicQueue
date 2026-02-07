import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const EmployeesTab = ({ selectedOrg }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        fetchEmployees();
    }, [selectedOrg]);

    useEffect(() => {
        const fetchOrgs = async () => {
            const orgsSnapshot = await getDocs(collection(db, 'organizations'));
            const orgsData = orgsSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            }));
            setOrganizations(orgsData);
        };
        fetchOrgs();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            let q = collection(db, 'users');

            // Filter by role = employee or operator
            q = query(q, where('role', 'in', ['employee', 'operator', 'orgAdmin']));

            if (selectedOrg !== 'all') {
                q = query(q, where('organizationId', '==', selectedOrg));
            }

            q = query(q, orderBy('createdAt', 'desc'), limit(500));

            const snapshot = await getDocs(q);
            const employeesData = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const empData = { id: doc.id, ...doc.data() };

                    // Get activity count (appointments handled)
                    const activityQuery = query(
                        collection(db, 'appointments'),
                        where('employeeId', '==', doc.id)
                    );
                    const activitySnapshot = await getDocs(activityQuery);
                    empData.activityCount = activitySnapshot.size;

                    return empData;
                })
            );

            setEmployees(employeesData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to load employees');
            setLoading(false);
        }
    };

    const getFilteredEmployees = () => {
        return employees.filter(emp => {
            const matchesSearch =
                emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.phone?.includes(searchTerm);

            return matchesSearch;
        });
    };

    const exportToExcel = () => {
        const filteredData = getFilteredEmployees();

        console.log('Exporting employees:', filteredData.length);
        console.log('Sample employee:', filteredData[0]);

        if (filteredData.length === 0) {
            toast.error('No employees to export!');
            return;
        }

        const orgName = selectedOrg === 'all' ? 'All' :
            organizations.find(o => o.id === selectedOrg)?.name || 'Unknown';

        const data = filteredData.map(e => ({
            'Name': e.name || 'N/A',
            'Email': e.email || 'N/A',
            'Phone': e.phone || 'N/A',
            'Role': e.role?.toUpperCase() || 'N/A',
            'Organization': organizations.find(o => o.id === e.organizationId)?.name || 'N/A',
            'Service Assignment': e.serviceId || 'N/A',
            'Activity Count': e.activityCount || 0,
            'Joined Date': e.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
        }));

        console.log('Mapped data for Excel:', data);

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Employees');

        XLSX.writeFile(wb, `employees_${orgName}_${Date.now()}.xlsx`);
        toast.success(`Exported ${data.length} employees successfully!`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading employees...</p>
            </div>
        );
    }

    const filteredEmployees = getFilteredEmployees();

    return (
        <div className="employees-tab">
            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Employees</span>
                        <span className="stat-card-icon">👔</span>
                    </div>
                    <div className="stat-card-value">{employees.length}</div>
                    <div className="stat-card-subtitle">
                        {selectedOrg === 'all' ? 'Across all organizations' : 'In selected organization'}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Activities</span>
                        <span className="stat-card-icon">📊</span>
                    </div>
                    <div className="stat-card-value">
                        {employees.reduce((sum, e) => sum + (e.activityCount || 0), 0)}
                    </div>
                    <div className="stat-card-subtitle">Appointments handled</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Avg Activities/Employee</span>
                        <span className="stat-card-icon">📈</span>
                    </div>
                    <div className="stat-card-value">
                        {employees.length > 0
                            ? (employees.reduce((sum, e) => sum + (e.activityCount || 0), 0) / employees.length).toFixed(1)
                            : 0
                        }
                    </div>
                    <div className="stat-card-subtitle">Average per employee</div>
                </div>
            </div>

            {/* Filters & Export */}
            <div className="filters-container">
                <input
                    type="text"
                    placeholder="🔍 Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="filter-input"
                />

                <button onClick={exportToExcel} className="export-btn">
                    📥 Export to Excel
                </button>
            </div>

            {/* Employees Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Organization</th>
                            <th>Activity Count</th>
                            <th>Joined Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan="7">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👔</div>
                                        <div className="empty-state-text">No employees found</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEmployees.map(employee => (
                                <tr key={employee.id}>
                                    <td><strong>{employee.name || 'N/A'}</strong></td>
                                    <td>{employee.email || 'N/A'}</td>
                                    <td>{employee.phone || 'N/A'}</td>
                                    <td>
                                        <span className="badge badge-info">
                                            {employee.role?.toUpperCase() || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        {organizations.find(o => o.id === employee.organizationId)?.name || 'N/A'}
                                    </td>
                                    <td>
                                        <span className="badge badge-primary">
                                            {employee.activityCount || 0}
                                        </span>
                                    </td>
                                    <td>
                                        {employee.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeesTab;
