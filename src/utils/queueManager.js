import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notifyYourTurn } from './notifications';

/**
 * Add customer to queue
 */
export const addToQueue = async (appointmentId, organizationId, serviceId, date) => {
    try {
        // Get or create queue for the day
        const queueRef = collection(db, 'queues');
        const q = query(
            queueRef,
            where('organizationId', '==', organizationId),
            where('serviceId', '==', serviceId),
            where('date', '==', date)
        );

        const querySnapshot = await getDocs(q);
        let queueId;

        if (querySnapshot.empty) {
            // Create new queue
            const newQueue = await addDoc(queueRef, {
                organizationId,
                serviceId,
                date,
                activeTokens: [appointmentId],
                currentToken: null,
                completedTokens: [],
                noShowTokens: [],
                totalServed: 0,
                averageWaitTime: 0,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            queueId = newQueue.id;
        } else {
            // Add to existing queue
            const queueDoc = querySnapshot.docs[0];
            queueId = queueDoc.id;
            const queueData = queueDoc.data();

            await updateDoc(doc(db, 'queues', queueId), {
                activeTokens: [...queueData.activeTokens, appointmentId],
                updatedAt: serverTimestamp()
            });
        }

        // Update appointment with queue position
        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        const position = queueDoc.data().activeTokens.length;

        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'CHECKED_IN',
            queuePosition: position,
            checkedInAt: serverTimestamp()
        });

        return { success: true, queueId, position };
    } catch (error) {
        console.error('Error adding to queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update queue positions for all appointments in active queue
 */
const updateQueuePositions = async (queueId, activeTokens) => {
    try {
        const updatePromises = activeTokens.map((appointmentId, index) => {
            return updateDoc(doc(db, 'appointments', appointmentId), {
                queuePosition: index + 1,
                updatedAt: serverTimestamp()
            });
        });
        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error updating queue positions:', error);
    }
};



/**
 * Call next token in queue
 */
export const callNextToken = async (queueId) => {
    try {
        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        const queueData = queueDoc.data();

        if (queueData.activeTokens.length === 0) {
            return { success: false, error: 'No tokens in queue' };
        }

        const nextToken = queueData.activeTokens[0];
        const remainingTokens = queueData.activeTokens.slice(1);

        await updateDoc(doc(db, 'queues', queueId), {
            currentToken: nextToken,
            activeTokens: remainingTokens,
            updatedAt: serverTimestamp()
        });

        // Update appointment status
        await updateDoc(doc(db, 'appointments', nextToken), {
            status: 'IN_PROGRESS',
            queuePosition: 0 // Currently being served
        });

        // Update positions for remaining tokens
        await updateQueuePositions(queueId, remainingTokens);

        // Send notification to customer
        const appointmentDoc = await getDoc(doc(db, 'appointments', nextToken));
        if (appointmentDoc.exists()) {
            const appData = appointmentDoc.data();
            if (appData.customerId) {
                await notifyYourTurn(appData.customerId, appData.organizationId, appData.tokenNumber);
            }
        }

        return { success: true, tokenId: nextToken };
    } catch (error) {
        console.error('Error calling next token:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark service as completed
 */
export const markCompleted = async (queueId, appointmentId) => {
    try {
        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        const queueData = queueDoc.data();

        await updateDoc(doc(db, 'queues', queueId), {
            currentToken: null,
            completedTokens: [...queueData.completedTokens, appointmentId],
            totalServed: queueData.totalServed + 1,
            updatedAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'COMPLETED',
            completedAt: serverTimestamp(),
            queuePosition: null // No longer in queue
        });

        // Update positions for remaining tokens
        await updateQueuePositions(queueId, queueData.activeTokens);

        return { success: true };
    } catch (error) {
        console.error('Error marking completed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark as no-show
 * @param {string} queueId - The queue ID
 * @param {string} appointmentId - The appointment ID
 * @param {Array} userPermissions - User's permissions array (optional, for backend validation)
 */
export const markNoShow = async (queueId, appointmentId, userPermissions = null) => {
    try {
        // Backend permission check (if permissions are provided)
        if (userPermissions && Array.isArray(userPermissions)) {
            if (!userPermissions.includes('HANDLE_NO_SHOW')) {
                return {
                    success: false,
                    error: 'Unauthorized: You do not have permission to mark no-show. This action is restricted to employees only.'
                };
            }
        }

        const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
        if (!appointmentDoc.exists()) {
            return { success: false, error: 'Appointment not found' };
        }
        const appointmentData = appointmentDoc.data();
        const customerId = appointmentData.customerId;

        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        const queueData = queueDoc.data();

        // Remove from active tokens if it's there
        let updatedActiveTokens = queueData.activeTokens.filter(id => id !== appointmentId);

        // If it was the current token, clear it
        let updatedCurrentToken = queueData.currentToken;
        if (updatedCurrentToken === appointmentId) {
            updatedCurrentToken = null;
        }

        // Add to end of queue for second chance
        updatedActiveTokens.push(appointmentId);

        await updateDoc(doc(db, 'queues', queueId), {
            currentToken: updatedCurrentToken,
            activeTokens: updatedActiveTokens,
            noShowTokens: [...(queueData.noShowTokens || []), appointmentId],
            updatedAt: serverTimestamp()
        });

        // Update appointment status to CHECKED_IN (giving second chance)
        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'CHECKED_IN',
            queuePosition: updatedActiveTokens.length,
            noShowAt: serverTimestamp()
        });

        // Update positions for all tokens
        await updateQueuePositions(queueId, updatedActiveTokens);

        // Increment user's no-show count
        if (customerId) {
            const userDoc = await getDoc(doc(db, 'users', customerId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                await updateDoc(doc(db, 'users', customerId), {
                    noShowCount: (userData.noShowCount || 0) + 1
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error marking no-show:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Prioritize a token in the queue
 */
export const prioritizeInQueue = async (queueId, appointmentId) => {
    try {
        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        const queueData = queueDoc.data();

        // Remove from current position and move to front
        const remainingTokens = queueData.activeTokens.filter(id => id !== appointmentId);
        const updatedActiveTokens = [appointmentId, ...remainingTokens];

        await updateDoc(doc(db, 'queues', queueId), {
            activeTokens: updatedActiveTokens,
            updatedAt: serverTimestamp()
        });

        // Update appointment status and flags
        await updateDoc(doc(db, 'appointments', appointmentId), {
            prioritized: true,
            prioritizedAt: serverTimestamp()
        });

        // Update positions for all tokens
        await updateQueuePositions(queueId, updatedActiveTokens);

        return { success: true };
    } catch (error) {
        console.error('Error prioritizing token:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Skip/Cancel a token from the queue
 */
export const skipFromQueue = async (queueId, appointmentId, reason = 'Skipped by admin') => {
    try {
        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        const queueData = queueDoc.data();

        // Remove from active tokens
        const updatedActiveTokens = queueData.activeTokens.filter(id => id !== appointmentId);

        // If it was the current token, clear it
        let updatedCurrentToken = queueData.currentToken;
        if (updatedCurrentToken === appointmentId) {
            updatedCurrentToken = null;
        }

        await updateDoc(doc(db, 'queues', queueId), {
            currentToken: updatedCurrentToken,
            activeTokens: updatedActiveTokens,
            updatedAt: serverTimestamp()
        });

        // Update appointment status to CANCELLED
        await updateDoc(doc(db, 'appointments', appointmentId), {
            status: 'CANCELLED',
            cancelledAt: serverTimestamp(),
            cancellationReason: reason,
            queuePosition: null
        });

        // Update positions for remaining tokens
        await updateQueuePositions(queueId, updatedActiveTokens);

        return { success: true };
    } catch (error) {
        console.error('Error skipping token:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate estimated wait time
 */
export const calculateWaitTime = (queuePosition, averageServiceTime) => {
    return queuePosition * averageServiceTime;
};

/**
 * Get queue status
 */
export const getQueueStatus = async (queueId) => {
    try {
        const queueDoc = await getDoc(doc(db, 'queues', queueId));
        if (!queueDoc.exists()) {
            return { success: false, error: 'Queue not found' };
        }

        const queueData = queueDoc.data();
        return {
            success: true,
            data: {
                activeCount: queueData.activeTokens.length,
                currentToken: queueData.currentToken,
                completedCount: queueData.completedTokens.length,
                noShowCount: queueData.noShowTokens.length,
                totalServed: queueData.totalServed,
                averageWaitTime: queueData.averageWaitTime
            }
        };
    } catch (error) {
        console.error('Error getting queue status:', error);
        return { success: false, error: error.message };
    }
};
