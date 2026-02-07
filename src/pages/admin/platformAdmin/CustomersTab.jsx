import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const CustomersTab = ({ selectedOrg }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        fetchCustomers();
    }, [selectedOrg]);

    useEffect(() => {
        // Fetch organizations for the dropdown
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

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            let q = collection(db, 'users');

            // Filter by role = customer
            q = query(q, where('role', '==', 'customer'));

            // Filter by organization if selected
            if (selectedOrg !== 'all') {
                q = query(q, where('organizationId', '==', selectedOrg));
            }

            q = query(q, orderBy('createdAt', 'desc'), limit(500));

            const snapshot = await getDocs(q);
            const customersData = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const customerData = { id: doc.id, ...doc.data() };

                    // Get booking count
                    const bookingsQuery = query(
                        collection(db, 'appointments'),
                        where('customerId', '==', doc.id)
                    );
                    const bookingsSnapshot = await getDocs(bookingsQuery);
                    customerData.bookingCount = bookingsSnapshot.size;

                    return customerData;
                })
            );

            setCustomers(customersData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to load customers');
            setLoading(false);
        }
    };

    const getFilteredCustomers = () => {
        return customers.filter(customer => {
            const matchesSearch =
                customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.phone?.includes(searchTerm);

            return matchesSearch;
        });
    };

    const exportToExcel = () => {
        const filteredData = getFilteredCustomers();

        console.log('Exporting customers:', filteredData.length);
        console.log('Sample customer:', filteredData[0]);

        if (filteredData.length === 0) {
            toast.error('No customers to export!');
            return;
        }

        const orgName = selectedOrg === 'all' ? 'All' :
            organizations.find(o => o.id === selectedOrg)?.name || 'Unknown';

        const data = filteredData.map(c => ({
            'Name': c.name || 'N/A',
            'Email': c.email || 'N/A',
            'Phone': c.phone || 'N/A',
            'Organization': organizations.find(o => o.id === c.organizationId)?.name || 'N/A',
            'Total Bookings': c.bookingCount || 0,
            'Joined Date': c.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
        }));

        console.log('Mapped data for Excel:', data);

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');

        XLSX.writeFile(wb, `customers_${orgName}_${Date.now()}.xlsx`);
        toast.success(`Exported ${data.length} customers successfully!`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading customers...</p>
            </div>
        );
    }

    const filteredCustomers = getFilteredCustomers();

    return (
        <div className="customers-tab">
            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Customers</span>
                        <span className="stat-card-icon">👥</span>
                    </div>
                    <div className="stat-card-value">{customers.length}</div>
                    <div className="stat-card-subtitle">
                        {selectedOrg === 'all' ? 'Across all organizations' : 'In selected organization'}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Bookings</span>
                        <span className="stat-card-icon">📅</span>
                    </div>
                    <div className="stat-card-value">
                        {customers.reduce((sum, c) => sum + (c.bookingCount || 0), 0)}
                    </div>
                    <div className="stat-card-subtitle">All-time bookings</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Avg Bookings/Customer</span>
                        <span className="stat-card-icon">📊</span>
                    </div>
                    <div className="stat-card-value">
                        {customers.length > 0
                            ? (customers.reduce((sum, c) => sum + (c.bookingCount || 0), 0) / customers.length).toFixed(1)
                            : 0
                        }
                    </div>
                    <div className="stat-card-subtitle">Average per customer</div>
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

            {/* Customers Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Organization</th>
                            <th>Total Bookings</th>
                            <th>Joined Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👥</div>
                                        <div className="empty-state-text">No customers found</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td><strong>{customer.name || 'N/A'}</strong></td>
                                    <td>{customer.email || 'N/A'}</td>
                                    <td>{customer.phone || 'N/A'}</td>
                                    <td>
                                        {organizations.find(o => o.id === customer.organizationId)?.name || 'N/A'}
                                    </td>
                                    <td>
                                        <span className="badge badge-primary">
                                            {customer.bookingCount || 0}
                                        </span>
                                    </td>
                                    <td>
                                        {customer.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
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

export default CustomersTab;
