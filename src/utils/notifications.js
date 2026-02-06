import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
    APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
    QUEUE_ACTIVATED: 'QUEUE_ACTIVATED',
    TURN_REMINDER: 'TURN_REMINDER',
    NO_SHOW: 'NO_SHOW',
    APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
    APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED'
};

/**
 * Create notification
 */
export const createNotification = async ({
    userId,
    organizationId,
    type,
    title,
    message,
    data = {}
}) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            organizationId,
            type,
            title,
            message,
            data,
            isRead: false,
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send appointment confirmation notification
 */
export const notifyAppointmentConfirmed = async (userId, organizationId, appointmentData) => {
    return createNotification({
        userId,
        organizationId,
        type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
        title: 'Appointment Confirmed',
        message: `Your appointment has been confirmed for ${appointmentData.date} at ${appointmentData.time}`,
        data: { appointmentId: appointmentData.id }
    });
};

/**
 * Send queue activation notification
 */
export const notifyQueueActivated = async (userId, organizationId, queueData) => {
    return createNotification({
        userId,
        organizationId,
        type: NOTIFICATION_TYPES.QUEUE_ACTIVATED,
        title: 'Added to Queue',
        message: `You have been added to the queue. Your position: ${queueData.position}`,
        data: { queueId: queueData.id, position: queueData.position }
    });
};

/**
 * Send turn reminder notification
 */
/**
 * Send turn reminder notification
 */
export const notifyTurnReminder = async (userId, organizationId, queueData) => {
    return createNotification({
        userId,
        organizationId,
        type: NOTIFICATION_TYPES.TURN_REMINDER,
        title: 'Turn Reminder',
        message: `You are next in line! Please be ready.`,
        data: { queueId: queueData.id }
    });
};

/**
 * Send "Your Turn" notification
 */
export const notifyYourTurn = async (userId, organizationId, tokenNumber) => {
    return createNotification({
        userId,
        organizationId,
        type: NOTIFICATION_TYPES.TURN_REMINDER, // Re-using type or add new one if needed, but keeping simple
        title: 'It is Your Turn! 🔔',
        message: `Token ${tokenNumber} - Please proceed to the counter.`,
        data: { tokenNumber }
    });
};

/**
 * Send no-show notification
 */
export const notifyNoShow = async (userId, organizationId, appointmentData) => {
    return createNotification({
        userId,
        organizationId,
        type: NOTIFICATION_TYPES.NO_SHOW,
        title: 'Missed Appointment',
        message: `You missed your appointment on ${appointmentData.date}. Please reschedule.`,
        data: { appointmentId: appointmentData.id }
    });
};
