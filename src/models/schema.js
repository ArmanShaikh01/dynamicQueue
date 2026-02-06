// Database Schema Models for Firestore Collections

export const UserSchema = {
    uid: 'string',
    email: 'string',
    name: 'string',
    phone: 'string',
    role: 'string', // PLATFORM_ADMIN, ORG_ADMIN, EMPLOYEE, CUSTOMER
    permissions: 'array',
    organizationId: 'string | null',
    noShowCount: 'number',
    isActive: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const OrganizationSchema = {
    name: 'string',
    description: 'string',
    type: 'string', // hospital, clinic, office, service_center, government, other
    contact: {
        email: 'string',
        phone: 'string',
        address: 'string'
    },
    workingHours: {
        monday: { isOpen: 'boolean', start: 'string', end: 'string' },
        tuesday: { isOpen: 'boolean', start: 'string', end: 'string' },
        wednesday: { isOpen: 'boolean', start: 'string', end: 'string' },
        thursday: { isOpen: 'boolean', start: 'string', end: 'string' },
        friday: { isOpen: 'boolean', start: 'string', end: 'string' },
        saturday: { isOpen: 'boolean', start: 'string', end: 'string' },
        sunday: { isOpen: 'boolean', start: 'string', end: 'string' }
    },
    breaks: 'array', // [{ start: 'HH:MM', end: 'HH:MM' }]
    isApproved: 'boolean',
    isActive: 'boolean',
    createdBy: 'string', // user UID
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const ServiceSchema = {
    organizationId: 'string',
    name: 'string',
    description: 'string',
    averageServiceTime: 'number', // in minutes
    staffCount: 'number',
    overbookingLimit: 'number',
    isActive: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const EmployeeSchema = {
    userId: 'string',
    organizationId: 'string',
    assignedServices: 'array', // service IDs
    permissions: 'array',
    isActive: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const AppointmentSchema = {
    organizationId: 'string',
    serviceId: 'string',
    customerId: 'string',
    customerName: 'string',
    customerPhone: 'string',
    appointmentDate: 'string', // YYYY-MM-DD
    appointmentTime: 'string', // HH:MM
    status: 'string', // BOOKED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
    qrCode: 'string',
    tokenNumber: 'string',
    queuePosition: 'number',
    estimatedWaitTime: 'number', // in minutes
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const QueueSchema = {
    organizationId: 'string',
    serviceId: 'string',
    date: 'string', // YYYY-MM-DD
    activeTokens: 'array', // appointment IDs
    completedTokens: 'array',
    noShowTokens: 'array',
    currentToken: 'string | null', // current appointment ID being served
    isActive: 'boolean',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
};

export const NotificationSchema = {
    userId: 'string',
    title: 'string',
    message: 'string',
    type: 'string', // APPOINTMENT_CONFIRMED, QUEUE_ACTIVATED, TURN_REMINDER, NO_SHOW
    relatedAppointmentId: 'string | null',
    isRead: 'boolean',
    createdAt: 'timestamp'
};

// Firestore Collection Names
export const COLLECTIONS = {
    USERS: 'users',
    ORGANIZATIONS: 'organizations',
    SERVICES: 'services',
    EMPLOYEES: 'employees',
    APPOINTMENTS: 'appointments',
    QUEUES: 'queues',
    NOTIFICATIONS: 'notifications'
};

// Status Constants
export const APPOINTMENT_STATUS = {
    BOOKED: 'BOOKED',
    CHECKED_IN: 'CHECKED_IN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW'
};

export const USER_ROLES = {
    PLATFORM_ADMIN: 'PLATFORM_ADMIN',
    ORG_ADMIN: 'ORG_ADMIN',
    EMPLOYEE: 'EMPLOYEE',
    CUSTOMER: 'CUSTOMER'
};

export const ORGANIZATION_TYPES = {
    HOSPITAL: 'hospital',
    CLINIC: 'clinic',
    OFFICE: 'office',
    SERVICE_CENTER: 'service_center',
    GOVERNMENT: 'government',
    OTHER: 'other'
};
