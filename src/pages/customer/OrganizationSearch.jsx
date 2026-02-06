import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const OrganizationSearch = () => {
    const [organizations, setOrganizations] = useState([]);
    const [filteredOrgs, setFilteredOrgs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for approved and active organizations
        const q = query(
            collection(db, 'organizations'),
            where('isApproved', '==', true),
            where('isActive', '==', true)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const orgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOrganizations(orgs);
                setFilteredOrgs(orgs);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching organizations:', error);
                toast.error('Failed to load organizations');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterOrganizations();
    }, [searchTerm, filterType, organizations]);

    const filterOrganizations = () => {
        let filtered = organizations;

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(org => org.type === filterType);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(org =>
                org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                org.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredOrgs(filtered);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading organizations...</p>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="gradient-text">🔍 Find Organizations</h1>
                <p>Search for organizations and book appointments</p>
            </div>

            {/* Search and Filter */}
            <div className="card-glass" style={{ marginBottom: '2rem' }}>
                <div className="grid grid-cols-1 grid-md-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="hospital">Hospital</option>
                            <option value="clinic">Clinic</option>
                            <option value="office">Office</option>
                            <option value="service_center">Service Center</option>
                            <option value="government">Government</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Organizations Grid */}
            {filteredOrgs.length === 0 ? (
                <div className="card-glass text-center">
                    <p style={{ fontSize: '1.2rem' }}>📋 No organizations found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 grid-md-2">
                    {filteredOrgs.map((org, index) => (
                        <div key={org.id} className="card-glass hover-lift fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="card-header">
                                <h3 className="gradient-text" style={{ marginBottom: '0.5rem', fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>{org.name}</h3>
                                <span className="badge badge-primary" style={{
                                    textTransform: 'capitalize'
                                }}>
                                    {org.type.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="card-body">
                                {org.description && (
                                    <p style={{ marginBottom: '1rem' }}>{org.description}</p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <div style={{ wordBreak: 'break-word' }}>
                                        <strong>📧 Email:</strong> {org.contact.email}
                                    </div>
                                    <div>
                                        <strong>📞 Phone:</strong> {org.contact.phone}
                                    </div>
                                    {org.contact.address && (
                                        <div style={{ wordBreak: 'break-word' }}>
                                            <strong>📍 Address:</strong> {org.contact.address}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-footer">
                                <Link
                                    to={`/customer/book/${org.id}`}
                                    className="btn-primary touch-target"
                                    style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                                >
                                    Book Appointment
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrganizationSearch;
