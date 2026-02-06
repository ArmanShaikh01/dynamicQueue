// Extended Database Schema Models for Admin Panel
// These schemas extend the base schema.js with admin-specific collections

export const RoleSchema = {
    id: 'string',
    name: 'string',
    description: 'string',
    permissions: 'array', // Array of permission codes
    scope: 'string', // 'PLATFORM' | 'ORGANIZATION'
    isSystem: 'boolean', // true for default roles, false for custom
    organizationId: 'string | null', // null for platform roles
    createdBy: 'string', // user UID
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const PermissionSchema = {
    id: 'string',
    code: 'string', // Unique permission code (e.g., 'MANAGE_SERVICE')
    name: 'string', // Display name
    description: 'string',
    category: 'string', // 'ORGANIZATION', 'SERVICE', 'QUEUE', 'EMPLOYEE', 'ANALYTICS'
    scope: 'string', // 'PLATFORM' | 'ORGANIZATION'
    createdAt: 'timestamp'
};

export const AuditLogSchema = {
    id: 'string',
    userId: 'string',
    userName: 'string',
    userRole: 'string',
    action: 'string', // Action code (e.g., 'ORG_APPROVED', 'EMPLOYEE_CREATED')
    entityType: 'string', // 'ORGANIZATION', 'USER', 'QUEUE', 'APPOINTMENT', 'ROLE', 'SETTINGS'
    entityId: 'string',
    changes: {
        before: 'object | null',
        after: 'object | null'
    },
    metadata: 'object', // Additional context
    organizationId: 'string | null',
    ipAddress: 'string | null',
    timestamp: 'timestamp'
};

export const SystemSettingsSchema = {
    id: 'global', // Single document
    defaultSlotDuration: 'number', // minutes
    defaultNoShowTimeout: 'number', // minutes
    qrCheckInEnabled: 'boolean',
    notificationsEnabled: 'boolean',
    newOrgRegistrationEnabled: 'boolean',
    maxEmployeesPerOrg: 'number',
    maxServicesPerOrg: 'number',
    maxDailyBookingsPerOrg: 'number',
    maintenanceMode: 'boolean',
    maintenanceMessage: 'string | null',
    updatedAt: 'timestamp',
    updatedBy: 'string'
};

export const OrganizationLimitsSchema = {
    id: 'string', // organizationId
    maxEmployees: 'number',
    maxServices: 'number',
    maxDailyBookings: 'number',
    currentEmployees: 'number', // Cached count
    currentServices: 'number', // Cached count
    customLimits: 'boolean', // true if overridden from defaults
    setBy: 'string', // Admin user ID
    setAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const AnalyticsSchema = {
    id: 'string',
    type: 'string', // 'DAILY', 'WEEKLY', 'MONTHLY'
    date: 'string', // YYYY-MM-DD
    organizationId: 'string | null', // null for platform-wide
    metrics: {
        totalAppointments: 'number',
        completedAppointments: 'number',
        cancelledAppointments: 'number',
        noShowCount: 'number',
        averageWaitTime: 'number', // minutes
        peakHour: 'string', // HH:00
        activeUsers: 'number',
        newRegistrations: 'number',
        hourlyDistribution: 'object', // { "09": 10, "10": 15, ... }
        serviceBreakdown: 'object' // { serviceId: count }
    },
    createdAt: 'timestamp'
};

// Enhanced User Schema (extends base UserSchema)
export const EnhancedUserSchema = {
    // ... all existing UserSchema fields
    roleId: 'string | null', // Reference to roles collection
    customPermissions: 'array', // Additional permissions beyond role
    lastLogin: 'timestamp',
    loginCount: 'number',
    profileImage: 'string | null',
    preferences: {
        theme: 'string', // 'light' | 'dark'
        notifications: 'boolean',
        language: 'string'
    }
};

// Enhanced Organization Schema (extends base OrganizationSchema)
export const EnhancedOrganizationSchema = {
    // ... all existing OrganizationSchema fields
    limits: {
        maxEmployees: 'number',
        maxServices: 'number',
        maxDailyBookings: 'number'
    },
    stats: {
        totalEmployees: 'number',
        totalServices: 'number',
        totalAppointments: 'number',
        lastUpdated: 'timestamp'
    },
    suspendedAt: 'timestamp | null',
    suspendedBy: 'string | null',
    suspensionReason: 'string | null',
    approvedAt: 'timestamp | null',
    approvedBy: 'string | null'
};

// Collection names for admin features
export const ADMIN_COLLECTIONS = {
    ROLES: 'roles',
    PERMISSIONS: 'permissions',
    AUDIT_LOGS: 'auditLogs',
    SYSTEM_SETTINGS: 'systemSettings',
    ORGANIZATION_LIMITS: 'organizationLimits',
    ANALYTICS: 'analytics'
};

// Audit log action types
export const AUDIT_ACTIONS = {
    // Organization actions
    ORG_CREATED: 'ORG_CREATED',
    ORG_APPROVED: 'ORG_APPROVED',
    ORG_REJECTED: 'ORG_REJECTED',
    ORG_SUSPENDED: 'ORG_SUSPENDED',
    ORG_REACTIVATED: 'ORG_REACTIVATED',
    ORG_UPDATED: 'ORG_UPDATED',
    ORG_LIMITS_CHANGED: 'ORG_LIMITS_CHANGED',

    // User/Employee actions
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
    USER_PERMISSIONS_CHANGED: 'USER_PERMISSIONS_CHANGED',
    EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
    EMPLOYEE_UPDATED: 'EMPLOYEE_UPDATED',
    EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',

    // Service actions
    SERVICE_CREATED: 'SERVICE_CREATED',
    SERVICE_UPDATED: 'SERVICE_UPDATED',
    SERVICE_DELETED: 'SERVICE_DELETED',

    // Queue actions
    QUEUE_OVERRIDDEN: 'QUEUE_OVERRIDDEN',
    TOKEN_SKIPPED: 'TOKEN_SKIPPED',
    TOKEN_PRIORITIZED: 'TOKEN_PRIORITIZED',
    QUEUE_RESET: 'QUEUE_RESET',

    // Role actions
    ROLE_CREATED: 'ROLE_CREATED',
    ROLE_UPDATED: 'ROLE_UPDATED',
    ROLE_DELETED: 'ROLE_DELETED',

    // Settings actions
    SETTINGS_UPDATED: 'SETTINGS_UPDATED',
    MAINTENANCE_MODE_TOGGLED: 'MAINTENANCE_MODE_TOGGLED'
};

// Entity types for audit logs
export const ENTITY_TYPES = {
    ORGANIZATION: 'ORGANIZATION',
    USER: 'USER',
    EMPLOYEE: 'EMPLOYEE',
    SERVICE: 'SERVICE',
    QUEUE: 'QUEUE',
    APPOINTMENT: 'APPOINTMENT',
    ROLE: 'ROLE',
    SETTINGS: 'SETTINGS'
};

// Analytics types
export const ANALYTICS_TYPES = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
};
