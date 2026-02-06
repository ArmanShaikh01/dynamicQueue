import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ADMIN_COLLECTIONS, AUDIT_ACTIONS, ENTITY_TYPES } from '../models/adminSchema';

/**
 * Audit Logger Utility
 * Logs all admin actions for compliance and tracking
 */

/**
 * Log an admin action to the audit log
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - Action code from AUDIT_ACTIONS
 * @param {string} params.entityType - Entity type from ENTITY_TYPES
 * @param {string} params.entityId - ID of the affected entity
 * @param {Object} params.user - User object { uid, name, role }
 * @param {Object} params.changes - Before/after snapshot { before, after }
 * @param {Object} params.metadata - Additional context
 * @param {string} params.organizationId - Organization ID (if applicable)
 */
export const logAuditAction = async ({
    action,
    entityType,
    entityId,
    user,
    changes = {},
    metadata = {},
    organizationId = null
}) => {
    try {
        const auditLog = {
            userId: user.uid,
            userName: user.name || user.email,
            userRole: user.role,
            action,
            entityType,
            entityId,
            changes: {
                before: changes.before || null,
                after: changes.after || null
            },
            metadata,
            organizationId,
            ipAddress: null, // Can be populated from request if needed
            timestamp: serverTimestamp()
        };

        await addDoc(collection(db, ADMIN_COLLECTIONS.AUDIT_LOGS), auditLog);

        console.log('Audit log created:', action, entityType, entityId);
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw - audit logging should not break the main operation
    }
};

/**
 * Log organization approval
 */
export const logOrgApproval = async (orgId, orgName, adminUser) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.ORG_APPROVED,
        entityType: ENTITY_TYPES.ORGANIZATION,
        entityId: orgId,
        user: adminUser,
        changes: {
            before: { isApproved: false, isActive: false },
            after: { isApproved: true, isActive: true }
        },
        metadata: { organizationName: orgName }
    });
};

/**
 * Log organization suspension
 */
export const logOrgSuspension = async (orgId, orgName, reason, adminUser) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.ORG_SUSPENDED,
        entityType: ENTITY_TYPES.ORGANIZATION,
        entityId: orgId,
        user: adminUser,
        changes: {
            before: { isActive: true },
            after: { isActive: false }
        },
        metadata: {
            organizationName: orgName,
            suspensionReason: reason
        }
    });
};

/**
 * Log organization limits change
 */
export const logOrgLimitsChange = async (orgId, oldLimits, newLimits, adminUser) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.ORG_LIMITS_CHANGED,
        entityType: ENTITY_TYPES.ORGANIZATION,
        entityId: orgId,
        user: adminUser,
        changes: {
            before: oldLimits,
            after: newLimits
        }
    });
};

/**
 * Log employee creation
 */
export const logEmployeeCreation = async (employeeId, employeeData, adminUser, organizationId) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.EMPLOYEE_CREATED,
        entityType: ENTITY_TYPES.EMPLOYEE,
        entityId: employeeId,
        user: adminUser,
        changes: {
            after: employeeData
        },
        organizationId
    });
};

/**
 * Log service creation
 */
export const logServiceCreation = async (serviceId, serviceData, adminUser, organizationId) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.SERVICE_CREATED,
        entityType: ENTITY_TYPES.SERVICE,
        entityId: serviceId,
        user: adminUser,
        changes: {
            after: serviceData
        },
        organizationId
    });
};

/**
 * Log queue override
 */
export const logQueueOverride = async (queueId, overrideType, details, adminUser, organizationId) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.QUEUE_OVERRIDDEN,
        entityType: ENTITY_TYPES.QUEUE,
        entityId: queueId,
        user: adminUser,
        metadata: {
            overrideType,
            ...details
        },
        organizationId
    });
};

/**
 * Log role creation/update
 */
export const logRoleChange = async (roleId, roleData, isNew, adminUser) => {
    await logAuditAction({
        action: isNew ? AUDIT_ACTIONS.ROLE_CREATED : AUDIT_ACTIONS.ROLE_UPDATED,
        entityType: ENTITY_TYPES.ROLE,
        entityId: roleId,
        user: adminUser,
        changes: {
            after: roleData
        }
    });
};

/**
 * Log system settings update
 */
export const logSettingsUpdate = async (oldSettings, newSettings, adminUser) => {
    await logAuditAction({
        action: AUDIT_ACTIONS.SETTINGS_UPDATED,
        entityType: ENTITY_TYPES.SETTINGS,
        entityId: 'global',
        user: adminUser,
        changes: {
            before: oldSettings,
            after: newSettings
        }
    });
};

/**
 * Log service changes (create/update/delete)
 */
export const logServiceChange = async (serviceId, action, serviceData, adminUser, organizationId) => {
    await logAuditAction({
        action,
        entityType: ENTITY_TYPES.SERVICE,
        entityId: serviceId,
        user: adminUser,
        changes: {
            after: serviceData
        },
        organizationId
    });
};

/**
 * Log user management actions (password reset, block/unblock, role change)
 */
export const logUserAction = async (userId, action, performedBy, metadata = {}) => {
    await logAuditAction({
        action,
        entityType: ENTITY_TYPES.USER,
        entityId: userId,
        user: performedBy,
        metadata
    });
};

export default {
    logAuditAction,
    logOrgApproval,
    logOrgSuspension,
    logOrgLimitsChange,
    logEmployeeCreation,
    logServiceCreation,
    logQueueOverride,
    logRoleChange,
    logSettingsUpdate,
    logServiceChange,
    logUserAction
};
