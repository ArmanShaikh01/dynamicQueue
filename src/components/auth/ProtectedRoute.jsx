import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Supports both role-based and permission-based access control
 * 
 * @param {Array} allowedRoles - Array of role strings (e.g., ['ORG_ADMIN', 'EMPLOYEE'])
 * @param {Array} requiredPermissions - Array of permission strings (e.g., ['VIEW_QUEUE'])
 * 
 * Access is granted if user satisfies EITHER:
 * - Has one of the allowedRoles (if specified)
 * - Has one of the requiredPermissions (if specified)
 */
const ProtectedRoute = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
    const { currentUser, userProfile, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!currentUser) {
        console.log('🔒 ProtectedRoute: No current user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Debug logging
    console.log('🔍 ProtectedRoute Debug:', {
        userRole: userProfile?.role,
        allowedRoles,
        requiredPermissions,
        userPermissions: userProfile?.permissions,
        userProfileExists: !!userProfile
    });

    // Check role-based access
    const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(userProfile?.role);

    // Check permission-based access
    const hasPermissionAccess = requiredPermissions.length === 0 ||
        requiredPermissions.some(permission => hasPermission(permission));

    // Grant access if user has either role OR permission access
    // If both arrays are empty, grant access (public protected route)
    const hasAccess = (allowedRoles.length === 0 && requiredPermissions.length === 0) ||
        hasRoleAccess || hasPermissionAccess;

    console.log('✅ ProtectedRoute Access Check:', {
        hasRoleAccess,
        hasPermissionAccess,
        finalDecision: hasAccess ? 'GRANTED' : 'DENIED'
    });

    if (!hasAccess) {
        console.error('❌ ProtectedRoute: Access DENIED, redirecting to /unauthorized');
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('✅ ProtectedRoute: Access GRANTED, rendering protected content');
    return children;
};

export default ProtectedRoute;
