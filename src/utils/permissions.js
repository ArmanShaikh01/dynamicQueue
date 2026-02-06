// Permission constants
export const PERMISSIONS = {
    // Platform Admin
    MANAGE_PLATFORM: 'MANAGE_PLATFORM',
    APPROVE_ORGANIZATIONS: 'APPROVE_ORGANIZATIONS',
    VIEW_PLATFORM_ANALYTICS: 'VIEW_PLATFORM_ANALYTICS',

    // Organization Admin
    CREATE_ORG: 'CREATE_ORG',
    MANAGE_ORG: 'MANAGE_ORG',
    MANAGE_SERVICE: 'MANAGE_SERVICE',
    MANAGE_EMPLOYEE: 'MANAGE_EMPLOYEE',
    VIEW_ORG_ANALYTICS: 'VIEW_ORG_ANALYTICS',
    CONFIGURE_SLOTS: 'CONFIGURE_SLOTS',

    // Employee/Operator
    SCAN_QR: 'SCAN_QR',
    CALL_TOKEN: 'CALL_TOKEN',
    VIEW_QUEUE: 'VIEW_QUEUE',
    MARK_COMPLETE: 'MARK_COMPLETE',
    MARK_NO_SHOW: 'MARK_NO_SHOW',

    // Customer
    BOOK_APPOINTMENT: 'BOOK_APPOINTMENT',
    CANCEL_APPOINTMENT: 'CANCEL_APPOINTMENT',
    RESCHEDULE_APPOINTMENT: 'RESCHEDULE_APPOINTMENT',
    VIEW_MY_APPOINTMENTS: 'VIEW_MY_APPOINTMENTS',
    VIEW_LIVE_QUEUE: 'VIEW_LIVE_QUEUE'
};

// Role definitions with default permissions
export const ROLES = {
    PLATFORM_ADMIN: {
        name: 'Platform Admin',
        permissions: [
            PERMISSIONS.MANAGE_PLATFORM,
            PERMISSIONS.APPROVE_ORGANIZATIONS,
            PERMISSIONS.VIEW_PLATFORM_ANALYTICS
        ]
    },
    ORG_ADMIN: {
        name: 'Organization Admin',
        permissions: [
            PERMISSIONS.CREATE_ORG,
            PERMISSIONS.MANAGE_ORG,
            PERMISSIONS.MANAGE_SERVICE,
            PERMISSIONS.MANAGE_EMPLOYEE,
            PERMISSIONS.VIEW_ORG_ANALYTICS,
            PERMISSIONS.CONFIGURE_SLOTS,
            'ORG_MANAGE_QUEUE',      // For QueueMonitor access
            'ORG_OVERRIDE_QUEUE',    // For queue override actions
            'ORG_MANAGE_NO_SHOW',    // For NoShowManagement access
            'VIEW_QUEUE',            // For viewing queue
            'SCAN_QR',               // For QR scanning
            'CALL_NEXT_TOKEN',       // For calling next token
            'MARK_COMPLETED',        // For marking complete
            'MARK_NO_SHOW'           // For marking no-show
        ]
    },
    EMPLOYEE: {
        name: 'Employee',
        permissions: [
            PERMISSIONS.SCAN_QR,
            PERMISSIONS.CALL_TOKEN,
            PERMISSIONS.VIEW_QUEUE,
            PERMISSIONS.MARK_COMPLETE,
            PERMISSIONS.MARK_NO_SHOW
        ]
    },
    CUSTOMER: {
        name: 'Customer',
        permissions: [
            PERMISSIONS.BOOK_APPOINTMENT,
            PERMISSIONS.CANCEL_APPOINTMENT,
            PERMISSIONS.RESCHEDULE_APPOINTMENT,
            PERMISSIONS.VIEW_MY_APPOINTMENTS,
            PERMISSIONS.VIEW_LIVE_QUEUE
        ]
    }
};

// Check if user has a specific permission
export const hasPermission = (userPermissions, permission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return userPermissions.includes(permission);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (userPermissions, permissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return permissions.some(permission => userPermissions.includes(permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (userPermissions, permissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        return false;
    }
    return permissions.every(permission => userPermissions.includes(permission));
};

// Get permissions for a role
export const getPermissionsForRole = (role) => {
    return ROLES[role]?.permissions || [];
};

// Check if user has a specific role
export const hasRole = (userRole, role) => {
    return userRole === role;
};
