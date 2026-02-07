import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { PERMISSION_CODES } from '../../models/permissions';
import OrganizationsTab from './platformAdmin/OrganizationsTab';
import AnalyticsTab from './platformAdmin/AnalyticsTab';
import ReportsTab from './platformAdmin/ReportsTab';
import '../../styles/PlatformAdmin.css';

const PlatformAdminPanel = () => {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('organizations');
    const [selectedOrg, setSelectedOrg] = useState('all'); // Global organization filter
    const [organizations, setOrganizations] = useState([]);

    // Fetch organizations for dropdown
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const orgsSnapshot = await getDocs(collection(db, 'organizations'));
                const orgsData = orgsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setOrganizations(orgsData);
            } catch (error) {
                console.error('Error fetching organizations:', error);
            }
        };
        fetchOrganizations();
    }, []);

    const tabs = [
        { id: 'organizations', label: 'Organizations', icon: '🏢', component: OrganizationsTab },
        { id: 'analytics', label: 'Analytics', icon: '📊', component: AnalyticsTab },
        { id: 'reports', label: 'Reports', icon: '📄', component: ReportsTab },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <PermissionGuard permission={PERMISSION_CODES.PLATFORM_VIEW_ANALYTICS}>
            <div className="platform-admin-panel">
                {/* Header */}
                <div className="admin-header">
                    <div className="header-content">
                        <h1 className="gradient-text">🎯 Platform Admin Panel</h1>
                        <p className="header-subtitle">Enterprise-grade multi-tenant management system</p>
                    </div>

                    {/* Global Organization Filter */}
                    {activeTab !== 'organizations' && (
                        <div className="org-filter">
                            <label htmlFor="org-filter">Filter by Organization:</label>
                            <select
                                id="org-filter"
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                className="org-select"
                            >
                                <option value="all">All Organizations</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {ActiveComponent && (
                        <ActiveComponent
                            selectedOrg={selectedOrg}
                            setSelectedOrg={setSelectedOrg}
                        />
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
};

export default PlatformAdminPanel;
