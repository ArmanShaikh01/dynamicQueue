import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for checking user permissions
 * Supports both role-based and custom permissions
 */
export const usePermissions = () => {
    const { userProfile } = useAuth();

    const permissions = useMemo(() => {
        if (!userProfile) return [];

        // Get permissions from role
        const rolePermissions = userProfile.permissions || [];

        // Get custom permissions
        const customPermissions = userProfile.customPermissions || [];

        // Combine and deduplicate
        return [...new Set([...rolePermissions, ...customPermissions])];
    }, [userProfile]);

    /**
     * Check if user has a specific permission
     * @param {string} permissionCode - Permission code to check
     * @returns {boolean}
     */
    const hasPermission = (permissionCode) => {
        if (!userProfile) return false;

        // Platform admins have all permissions
        if (userProfile.role === 'PLATFORM_ADMIN') return true;

        return permissions.includes(permissionCode);
    };

    /**
     * Check if user has ANY of the specified permissions
     * @param {string[]} permissionCodes - Array of permission codes
     * @returns {boolean}
     */
    const hasAnyPermission = (permissionCodes) => {
        if (!userProfile) return false;
        if (userProfile.role === 'PLATFORM_ADMIN') return true;

        return permissionCodes.some(code => permissions.includes(code));
    };

    /**
     * Check if user has ALL of the specified permissions
     * @param {string[]} permissionCodes - Array of permission codes
     * @returns {boolean}
     */
    const hasAllPermissions = (permissionCodes) => {
        if (!userProfile) return false;
        if (userProfile.role === 'PLATFORM_ADMIN') return true;

        return permissionCodes.every(code => permissions.includes(code));
    };

    /**
     * Check if user is platform admin
     * @returns {boolean}
     */
    const isPlatformAdmin = () => {
        return userProfile?.role === 'PLATFORM_ADMIN';
    };

    /**
     * Check if user is organization admin
     * @returns {boolean}
     */
    const isOrgAdmin = () => {
        return userProfile?.role === 'ORG_ADMIN';
    };

    /**
     * Check if user belongs to a specific organization
     * @param {string} organizationId - Organization ID to check
     * @returns {boolean}
     */
    const belongsToOrganization = (organizationId) => {
        return userProfile?.organizationId === organizationId;
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isPlatformAdmin,
        isOrgAdmin,
        belongsToOrganization
    };
};

export default usePermissions;
