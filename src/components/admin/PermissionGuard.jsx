import { usePermissions } from '../../hooks/usePermissions';
import { Navigate } from 'react-router-dom';

/**
 * Permission Guard Component
 * Wraps components that require specific permissions
 * 
 * @param {string} permission - Single permission code required
 * @param {string[]} permissions - Array of permission codes (use with requireAll or requireAny)
 * @param {boolean} requireAll - If true, user must have ALL permissions in array
 * @param {boolean} requireAny - If true, user must have ANY permission in array (default)
 * @param {React.ReactNode} fallback - Component to show if permission denied (default: null)
 * @param {boolean} redirect - If true, redirect to unauthorized page (default: false)
 * @param {React.ReactNode} children - Protected content
 */
export const PermissionGuard = ({
    permission,
    permissions,
    requireAll = false,
    requireAny = false,
    fallback = null,
    redirect = false,
    children
}) => {
    const {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    } = usePermissions();

    let hasAccess = false;

    // Single permission check
    if (permission) {
        hasAccess = hasPermission(permission);
    }
    // Multiple permissions check
    else if (permissions && permissions.length > 0) {
        if (requireAll) {
            hasAccess = hasAllPermissions(permissions);
        } else {
            // Default to requireAny
            hasAccess = hasAnyPermission(permissions);
        }
    }
    // No permission specified - deny access
    else {
        hasAccess = false;
    }

    // If no access
    if (!hasAccess) {
        // Redirect to unauthorized page
        if (redirect) {
            return <Navigate to="/unauthorized" replace />;
        }
        // Show fallback component
        return fallback;
    }

    // Has access - render children
    return <>{children}</>;
};

/**
 * Higher-Order Component version of PermissionGuard
 * Usage: export default withPermission(MyComponent, 'MANAGE_SERVICE');
 */
export const withPermission = (Component, permission, options = {}) => {
    return (props) => (
        <PermissionGuard permission={permission} {...options}>
            <Component {...props} />
        </PermissionGuard>
    );
};

/**
 * Hook version for conditional rendering within components
 * Usage: const canManage = usePermissionCheck('MANAGE_SERVICE');
 */
export const usePermissionCheck = (permission) => {
    const { hasPermission } = usePermissions();
    return hasPermission(permission);
};

export default PermissionGuard;
