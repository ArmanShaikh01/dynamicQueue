import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Analytics Service for Organization Admin
 * Fetches and processes analytics data scoped to a specific organization
 */

/**
 * Fetch comprehensive analytics for an organization
 */
export const fetchOrgAnalytics = async (organizationId, dateRange = {}) => {
    try {
        const { start, end } = dateRange;

        // Build query constraints
        const constraints = [where('organizationId', '==', organizationId)];

        if (start) {
            const startDate = Timestamp.fromDate(new Date(start));
            constraints.push(where('createdAt', '>=', startDate));
        }

        if (end) {
            const endDate = Timestamp.fromDate(new Date(end + 'T23:59:59'));
            constraints.push(where('createdAt', '<=', endDate));
        }

        // Fetch appointments
        const appointmentsQuery = query(collection(db, 'appointments'), ...constraints);
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointments = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('📊 Fetched appointments:', appointments.length);

        // Calculate summary metrics
        const summary = calculateSummary(appointments);

        // Calculate service-wise metrics
        const serviceWise = await calculateServiceWiseMetrics(appointments, organizationId);

        // Calculate staff-wise metrics
        const staffWise = await calculateStaffWiseMetrics(appointments, organizationId);

        // Calculate trends
        const trends = calculateTrends(appointments);

        // Calculate cancellation reasons
        const cancellationReasons = calculateCancellationReasons(appointments);

        // Calculate no-show reasons
        const noShowReasons = calculateNoShowReasons(appointments);

        return {
            summary,
            serviceWise,
            staffWise,
            trends,
            cancellationReasons,
            noShowReasons,
            rawAppointments: appointments
        };
    } catch (error) {
        console.error('Error fetching org analytics:', error);
        throw error;
    }
};

/**
 * Calculate summary metrics
 */
const calculateSummary = (appointments) => {
    const summary = {
        totalBookings: appointments.length,
        completed: 0,
        cancelled: 0,
        noShows: 0,
        pending: 0,
        inProgress: 0,
        emergencyCases: 0,
        avgWaitingTime: 0
    };

    let totalWaitingTime = 0;
    let waitingTimeCount = 0;

    appointments.forEach(apt => {
        const status = apt.status?.toLowerCase();

        if (status === 'completed') summary.completed++;
        else if (status === 'cancelled') summary.cancelled++;
        else if (status === 'no-show' || status === 'no_show') summary.noShows++;
        else if (status === 'pending') summary.pending++;
        else if (status === 'in-progress' || status === 'in_progress') summary.inProgress++;

        if (apt.isEmergency) summary.emergencyCases++;

        if (apt.waitingTime) {
            totalWaitingTime += apt.waitingTime;
            waitingTimeCount++;
        }
    });

    if (waitingTimeCount > 0) {
        summary.avgWaitingTime = Math.round(totalWaitingTime / waitingTimeCount);
    }

    return summary;
};

/**
 * Calculate service-wise metrics
 */
const calculateServiceWiseMetrics = async (appointments, organizationId) => {
    // Fetch services for this organization
    const servicesQuery = query(
        collection(db, 'services'),
        where('organizationId', '==', organizationId)
    );
    const servicesSnapshot = await getDocs(servicesQuery);
    const services = {};
    servicesSnapshot.docs.forEach(doc => {
        services[doc.id] = doc.data().name;
    });

    // Group appointments by service
    const serviceMetrics = {};

    appointments.forEach(apt => {
        const serviceId = apt.serviceId;
        const serviceName = services[serviceId] || apt.serviceName || 'Unknown Service';

        if (!serviceMetrics[serviceId]) {
            serviceMetrics[serviceId] = {
                serviceId,
                serviceName,
                total: 0,
                completed: 0,
                cancelled: 0,
                noShows: 0,
                pending: 0
            };
        }

        const status = apt.status?.toLowerCase();
        serviceMetrics[serviceId].total++;

        if (status === 'completed') serviceMetrics[serviceId].completed++;
        else if (status === 'cancelled') serviceMetrics[serviceId].cancelled++;
        else if (status === 'no-show' || status === 'no_show') serviceMetrics[serviceId].noShows++;
        else if (status === 'pending') serviceMetrics[serviceId].pending++;
    });

    return Object.values(serviceMetrics);
};

/**
 * Calculate staff-wise metrics
 */
const calculateStaffWiseMetrics = async (appointments, organizationId) => {
    // Fetch employees for this organization
    const employeesQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId),
        where('role', 'in', ['EMPLOYEE', 'ORG_ADMIN'])
    );
    const employeesSnapshot = await getDocs(employeesQuery);
    const employees = {};
    employeesSnapshot.docs.forEach(doc => {
        employees[doc.id] = doc.data().name;
    });

    // Group appointments by staff
    const staffMetrics = {};

    appointments.forEach(apt => {
        const staffId = apt.assignedTo || apt.employeeId;
        if (!staffId) return;

        const staffName = employees[staffId] || apt.employeeName || 'Unknown Staff';

        if (!staffMetrics[staffId]) {
            staffMetrics[staffId] = {
                staffId,
                staffName,
                total: 0,
                completed: 0,
                cancelled: 0,
                noShows: 0,
                avgWaitingTime: 0,
                totalWaitingTime: 0,
                waitingTimeCount: 0
            };
        }

        const status = apt.status?.toLowerCase();
        staffMetrics[staffId].total++;

        if (status === 'completed') staffMetrics[staffId].completed++;
        else if (status === 'cancelled') staffMetrics[staffId].cancelled++;
        else if (status === 'no-show' || status === 'no_show') staffMetrics[staffId].noShows++;

        if (apt.waitingTime) {
            staffMetrics[staffId].totalWaitingTime += apt.waitingTime;
            staffMetrics[staffId].waitingTimeCount++;
        }
    });

    // Calculate average waiting times
    Object.values(staffMetrics).forEach(staff => {
        if (staff.waitingTimeCount > 0) {
            staff.avgWaitingTime = Math.round(staff.totalWaitingTime / staff.waitingTimeCount);
        }
        delete staff.totalWaitingTime;
        delete staff.waitingTimeCount;
    });

    return Object.values(staffMetrics);
};

/**
 * Calculate trends over time
 */
const calculateTrends = (appointments) => {
    const trendData = {};

    appointments.forEach(apt => {
        const date = apt.createdAt?.toDate?.()?.toISOString().split('T')[0] || 'Unknown';

        if (!trendData[date]) {
            trendData[date] = {
                date,
                total: 0,
                completed: 0,
                cancelled: 0,
                noShows: 0,
                pending: 0
            };
        }

        const status = apt.status?.toLowerCase();
        trendData[date].total++;

        if (status === 'completed') trendData[date].completed++;
        else if (status === 'cancelled') trendData[date].cancelled++;
        else if (status === 'no-show' || status === 'no_show') trendData[date].noShows++;
        else if (status === 'pending') trendData[date].pending++;
    });

    // Sort by date
    return Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Calculate cancellation reasons
 */
const calculateCancellationReasons = (appointments) => {
    const reasons = {};

    appointments
        .filter(apt => apt.status?.toLowerCase() === 'cancelled')
        .forEach(apt => {
            const reason = apt.cancellationReason || 'No reason provided';
            reasons[reason] = (reasons[reason] || 0) + 1;
        });

    return reasons;
};

/**
 * Calculate no-show reasons
 */
const calculateNoShowReasons = (appointments) => {
    const reasons = {};

    appointments
        .filter(apt => {
            const status = apt.status?.toLowerCase();
            return status === 'no-show' || status === 'no_show';
        })
        .forEach(apt => {
            const reason = apt.noShowReason || 'No reason provided';
            reasons[reason] = (reasons[reason] || 0) + 1;
        });

    return reasons;
};

/**
 * Fetch organization audit logs
 */
export const fetchOrgAuditLogs = async (organizationId, filters = {}) => {
    try {
        const constraints = [where('organizationId', '==', organizationId)];

        if (filters.startDate) {
            const startDate = Timestamp.fromDate(new Date(filters.startDate));
            constraints.push(where('timestamp', '>=', startDate));
        }

        if (filters.endDate) {
            const endDate = Timestamp.fromDate(new Date(filters.endDate + 'T23:59:59'));
            constraints.push(where('timestamp', '<=', endDate));
        }

        if (filters.action) {
            constraints.push(where('action', '==', filters.action));
        }

        if (filters.entityType) {
            constraints.push(where('entityType', '==', filters.entityType));
        }

        const logsQuery = query(
            collection(db, 'auditLogs'),
            ...constraints,
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(logsQuery);
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('📋 Fetched audit logs:', logs.length);
        return logs;
    } catch (error) {
        console.error('Error fetching org audit logs:', error);

        // If orderBy fails due to index, try without it
        if (error.code === 'failed-precondition') {
            const simpleQuery = query(collection(db, 'auditLogs'), ...constraints.slice(0, -1));
            const snapshot = await getDocs(simpleQuery);
            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort manually
            logs.sort((a, b) => {
                const timeA = a.timestamp?.toMillis?.() || 0;
                const timeB = b.timestamp?.toMillis?.() || 0;
                return timeB - timeA;
            });

            return logs;
        }

        throw error;
    }
};
