import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ApprovalPending from './ApprovalPending';
import AccessDenied from './AccessDenied';

/**
 * Wrapper component that checks organization approval status
 * before allowing access to organization pages
 */
const OrganizationWrapper = ({ children }) => {
    const { userProfile } = useAuth();
    const [organizationStatus, setOrganizationStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.organizationId) {
            setLoading(false);
            return;
        }

        const loadOrganizationStatus = async () => {
            try {
                const orgDoc = await getDoc(doc(db, 'organizations', userProfile.organizationId));
                if (orgDoc.exists()) {
                    const orgData = orgDoc.data();
                    setOrganizationStatus(orgData.status || 'APPROVED'); // Default to APPROVED for backward compatibility
                } else {
                    setOrganizationStatus('PENDING');
                }
            } catch (error) {
                console.error('Error loading organization status:', error);
                setOrganizationStatus('PENDING');
            } finally {
                setLoading(false);
            }
        };

        loadOrganizationStatus();
    }, [userProfile?.organizationId]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p style={{ marginTop: 'var(--spacing-md)', fontSize: '1.1rem' }}>
                    Verifying organization status...
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    Please wait while we check your approval status
                </p>
            </div>
        );
    }

    // Show approval pending screen if organization is not approved
    if (organizationStatus === 'PENDING') {
        return <ApprovalPending />;
    }

    // Show access denied screen if organization is rejected
    if (organizationStatus === 'REJECTED') {
        return <AccessDenied />;
    }

    // If approved, render the children (actual page content)
    return <>{children}</>;
};

export default OrganizationWrapper;
