// Permission Registry - Master list of all system permissions
// This file defines all available permissions in the system

export const PERMISSION_CATEGORIES = {
    PLATFORM: 'PLATFORM',
    ORGANIZATION: 'ORGANIZATION',
    SERVICE: 'SERVICE',
    QUEUE: 'QUEUE',
    EMPLOYEE: 'EMPLOYEE',
    ANALYTICS: 'ANALYTICS'
};

export const PERMISSIONS = {
    // Platform-level permissions (Platform Admin only)
    PLATFORM_VIEW_ANALYTICS: {
        code: 'PLATFORM_VIEW_ANALYTICS',
        name: 'View Platform Analytics',
        description: 'Access to platform-wide analytics and reports',
        category: PERMISSION_CATEGORIES.PLATFORM,
        scope: 'PLATFORM'
    },
    PLATFORM_MANAGE_ORGS: {
        code: 'PLATFORM_MANAGE_ORGS',
        name: 'Manage Organizations',
        description: 'Approve, suspend, and configure organizations',
        category: PERMISSION_CATEGORIES.PLATFORM,
        scope: 'PLATFORM'
    },
    PLATFORM_MANAGE_USERS: {
        code: 'PLATFORM_MANAGE_USERS',
        name: 'Manage Users',
        description: 'View user logs, reset passwords, block/unblock users, change roles',
        category: PERMISSION_CATEGORIES.PLATFORM,
        scope: 'PLATFORM'
    },
    PLATFORM_MANAGE_ROLES: {
        code: 'PLATFORM_MANAGE_ROLES',
        name: 'Manage Roles & Permissions',
        description: 'Create and edit role templates and permissions',
        category: PERMISSION_CATEGORIES.PLATFORM,
        scope: 'PLATFORM'
    },
    PLATFORM_MANAGE_SETTINGS: {
        code: 'PLATFORM_MANAGE_SETTINGS',
        name: 'Manage System Settings',
        description: 'Configure global system settings',
        category: PERMISSION_CATEGORIES.PLATFORM,
        scope: 'PLATFORM'
    },
    PLATFORM_VIEW_AUDIT_LOGS: {
        code: 'PLATFORM_VIEW_AUDIT_LOGS',
        name: 'View Audit Logs',
        description: 'Access to system audit logs',
        category: PERMISSION_CATEGORIES.PLATFORM,
        scope: 'PLATFORM'
    },

    // Organization-level permissions
    ORG_VIEW_DASHBOARD: {
        code: 'ORG_VIEW_DASHBOARD',
        name: 'View Organization Dashboard',
        description: 'Access to organization overview and statistics',
        category: PERMISSION_CATEGORIES.ORGANIZATION,
        scope: 'ORGANIZATION'
    },
    ORG_MANAGE_SERVICES: {
        code: 'ORG_MANAGE_SERVICES',
        name: 'Manage Services',
        description: 'Create, edit, and delete services',
        category: PERMISSION_CATEGORIES.SERVICE,
        scope: 'ORGANIZATION'
    },
    ORG_MANAGE_EMPLOYEES: {
        code: 'ORG_MANAGE_EMPLOYEES',
        name: 'Manage Employees',
        description: 'Add, edit, and remove employees',
        category: PERMISSION_CATEGORIES.EMPLOYEE,
        scope: 'ORGANIZATION'
    },
    ORG_MANAGE_QUEUE: {
        code: 'ORG_MANAGE_QUEUE',
        name: 'Manage Queue',
        description: 'Configure queue settings and working hours',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    ORG_VIEW_ANALYTICS: {
        code: 'ORG_VIEW_ANALYTICS',
        name: 'View Organization Analytics',
        description: 'Access to organization analytics and reports',
        category: PERMISSION_CATEGORIES.ANALYTICS,
        scope: 'ORGANIZATION'
    },
    ORG_MANAGE_SETTINGS: {
        code: 'ORG_MANAGE_SETTINGS',
        name: 'Manage Organization Settings',
        description: 'Configure organization-specific settings',
        category: PERMISSION_CATEGORIES.ORGANIZATION,
        scope: 'ORGANIZATION'
    },
    ORG_OVERRIDE_QUEUE: {
        code: 'ORG_OVERRIDE_QUEUE',
        name: 'Override Queue',
        description: 'Force skip, delay, or prioritize tokens',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    ORG_MANAGE_SLOTS: {
        code: 'ORG_MANAGE_SLOTS',
        name: 'Manage Appointment Slots',
        description: 'Configure working hours, breaks, and slot generation',
        category: PERMISSION_CATEGORIES.SERVICE,
        scope: 'ORGANIZATION'
    },
    ORG_MANAGE_NO_SHOW: {
        code: 'ORG_MANAGE_NO_SHOW',
        name: 'Manage No-Shows',
        description: 'Configure no-show settings and handle exceptions',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },

    // Employee/Operator-level permissions
    SCAN_QR: {
        code: 'SCAN_QR',
        name: 'Scan QR Codes',
        description: 'Check-in customers via QR code scanning',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    CALL_NEXT_TOKEN: {
        code: 'CALL_NEXT_TOKEN',
        name: 'Call Next Token',
        description: 'Call the next customer in queue',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    MARK_COMPLETED: {
        code: 'MARK_COMPLETED',
        name: 'Mark Service Completed',
        description: 'Mark appointments as completed',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    MARK_NO_SHOW: {
        code: 'MARK_NO_SHOW',
        name: 'Mark No-Show',
        description: 'Mark appointments as no-show',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    VIEW_QUEUE: {
        code: 'VIEW_QUEUE',
        name: 'View Queue',
        description: 'View current queue status',
        category: PERMISSION_CATEGORIES.QUEUE,
        scope: 'ORGANIZATION'
    },
    VIEW_APPOINTMENTS: {
        code: 'VIEW_APPOINTMENTS',
        name: 'View Appointments',
        description: 'View appointment details',
        category: PERMISSION_CATEGORIES.SERVICE,
        scope: 'ORGANIZATION'
    }
};

// Default role templates
export const DEFAULT_ROLES = {
    PLATFORM_ADMIN: {
        name: 'Platform Administrator',
        description: 'Full platform access with all permissions',
        permissions: [
            'PLATFORM_VIEW_ANALYTICS',
            'PLATFORM_MANAGE_ORGS',
            'PLATFORM_MANAGE_USERS',
            'PLATFORM_MANAGE_ROLES',
            'PLATFORM_MANAGE_SETTINGS',
            'PLATFORM_VIEW_AUDIT_LOGS'
        ],
        scope: 'PLATFORM',
        isSystem: true
    },
    ORG_ADMIN: {
        name: 'Organization Administrator',
        description: 'Full organization management access',
        permissions: [
            'ORG_VIEW_DASHBOARD',
            'ORG_MANAGE_SERVICES',
            'ORG_MANAGE_EMPLOYEES',
            'ORG_MANAGE_QUEUE',
            'ORG_VIEW_ANALYTICS',
            'ORG_MANAGE_SETTINGS',
            'ORG_OVERRIDE_QUEUE',
            'ORG_MANAGE_SLOTS',
            'ORG_MANAGE_NO_SHOW',
            'VIEW_QUEUE',
            'VIEW_APPOINTMENTS'
        ],
        scope: 'ORGANIZATION',
        isSystem: true
    },
    QUEUE_MANAGER: {
        name: 'Queue Manager',
        description: 'Manage queues and call customers',
        permissions: [
            'VIEW_QUEUE',
            'CALL_NEXT_TOKEN',
            'MARK_COMPLETED',
            'MARK_NO_SHOW',
            'VIEW_APPOINTMENTS',
            'ORG_OVERRIDE_QUEUE'
        ],
        scope: 'ORGANIZATION',
        isSystem: true
    },
    OPERATOR: {
        name: 'Operator',
        description: 'Basic queue operations',
        permissions: [
            'SCAN_QR',
            'VIEW_QUEUE',
            'CALL_NEXT_TOKEN',
            'MARK_COMPLETED',
            'MARK_NO_SHOW',
            'VIEW_APPOINTMENTS'
        ],
        scope: 'ORGANIZATION',
        isSystem: true
    },
    SERVICE_MANAGER: {
        name: 'Service Manager',
        description: 'Manage services and slots',
        permissions: [
            'ORG_VIEW_DASHBOARD',
            'ORG_MANAGE_SERVICES',
            'ORG_MANAGE_SLOTS',
            'VIEW_QUEUE',
            'VIEW_APPOINTMENTS'
        ],
        scope: 'ORGANIZATION',
        isSystem: true
    }
};

// Helper function to get all permission codes
export const getAllPermissionCodes = () => {
    return Object.keys(PERMISSIONS);
};

// Helper function to get permissions by category
export const getPermissionsByCategory = (category) => {
    return Object.values(PERMISSIONS).filter(p => p.category === category);
};

// Helper function to get permissions by scope
export const getPermissionsByScope = (scope) => {
    return Object.values(PERMISSIONS).filter(p => p.scope === scope);
};

// Export permission codes as constants for easy import
export const PERMISSION_CODES = Object.keys(PERMISSIONS).reduce((acc, key) => {
    acc[key] = key;
    return acc;
}, {});
