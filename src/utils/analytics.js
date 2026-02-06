import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ADMIN_COLLECTIONS, ANALYTICS_TYPES } from '../models/adminSchema';

/**
 * Analytics Utility
 * Functions for aggregating and retrieving analytics data
 */

/**
 * Aggregate daily metrics for an organization or platform-wide
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string|null} organizationId - Organization ID or null for platform-wide
 */
export const aggregateDailyMetrics = async (date, organizationId = null) => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Query appointments for the day
        let appointmentsQuery = query(
            collection(db, 'appointments'),
            where('appointmentDate', '==', date)
        );

        if (organizationId) {
            appointmentsQuery = query(
                appointmentsQuery,
                where('organizationId', '==', organizationId)
            );
        }

        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointments = appointmentsSnapshot.docs.map(doc => doc.data());

        // Calculate metrics
        const metrics = calculateMetrics(appointments);

        // Save to analytics collection
        await addDoc(collection(db, ADMIN_COLLECTIONS.ANALYTICS), {
            type: ANALYTICS_TYPES.DAILY,
            date,
            organizationId,
            metrics,
            createdAt: serverTimestamp()
        });

        return metrics;
    } catch (error) {
        console.error('Error aggregating daily metrics:', error);
        throw error;
    }
};

/**
 * Calculate metrics from appointments data
 */
const calculateMetrics = (appointments) => {
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShowCount = appointments.filter(a => a.status === 'NO_SHOW').length;

    // Calculate average wait time
    const waitTimes = appointments
        .filter(a => a.estimatedWaitTime)
        .map(a => a.estimatedWaitTime);
    const averageWaitTime = waitTimes.length > 0
        ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
        : 0;

    // Calculate hourly distribution
    const hourlyDistribution = {};
    appointments.forEach(appointment => {
        if (appointment.appointmentTime) {
            const hour = appointment.appointmentTime.split(':')[0];
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        }
    });

    // Find peak hour
    let peakHour = '00';
    let maxCount = 0;
    Object.entries(hourlyDistribution).forEach(([hour, count]) => {
        if (count > maxCount) {
            maxCount = count;
            peakHour = hour;
        }
    });

    // Service breakdown
    const serviceBreakdown = {};
    appointments.forEach(appointment => {
        if (appointment.serviceId) {
            serviceBreakdown[appointment.serviceId] = (serviceBreakdown[appointment.serviceId] || 0) + 1;
        }
    });

    return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowCount,
        averageWaitTime,
        peakHour: `${peakHour}:00`,
        hourlyDistribution,
        serviceBreakdown,
        completionRate: totalAppointments > 0
            ? Math.round((completedAppointments / totalAppointments) * 100)
            : 0,
        noShowRate: totalAppointments > 0
            ? Math.round((noShowCount / totalAppointments) * 100)
            : 0
    };
};

/**
 * Get platform-wide statistics
 */
export const getPlatformStats = async () => {
    try {
        // Get total organizations
        const orgsSnapshot = await getDocs(collection(db, 'organizations'));
        const organizations = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalOrgs = organizations.length;
        const approvedOrgs = organizations.filter(org => org.isApproved).length;
        const activeOrgs = organizations.filter(org => org.isActive).length;
        const pendingOrgs = organizations.filter(org => !org.isApproved).length;

        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalUsers = users.length;
        const customers = users.filter(u => u.role === 'CUSTOMER').length;
        const employees = users.filter(u => u.role === 'EMPLOYEE').length;
        const orgAdmins = users.filter(u => u.role === 'ORG_ADMIN').length;

        // Get today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppointmentsQuery = query(
            collection(db, 'appointments'),
            where('appointmentDate', '==', today)
        );
        const todayAppointmentsSnapshot = await getDocs(todayAppointmentsQuery);
        const appointmentsToday = todayAppointmentsSnapshot.size;

        // Get this month's appointments
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        const monthStart = firstDayOfMonth.toISOString().split('T')[0];

        const monthAppointmentsQuery = query(
            collection(db, 'appointments'),
            where('appointmentDate', '>=', monthStart)
        );
        const monthAppointmentsSnapshot = await getDocs(monthAppointmentsQuery);
        const appointmentsMonth = monthAppointmentsSnapshot.size;

        return {
            totalOrgs,
            approvedOrgs,
            activeOrgs,
            pendingOrgs,
            totalUsers,
            customers,
            employees,
            orgAdmins,
            appointmentsToday,
            appointmentsMonth
        };
    } catch (error) {
        console.error('Error getting platform stats:', error);
        throw error;
    }
};

/**
 * Get organization statistics
 */
export const getOrganizationStats = async (organizationId) => {
    try {
        // Get employees count
        const employeesQuery = query(
            collection(db, 'users'),
            where('organizationId', '==', organizationId),
            where('role', '==', 'EMPLOYEE')
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const totalEmployees = employeesSnapshot.size;

        // Get services count
        const servicesQuery = query(
            collection(db, 'services'),
            where('organizationId', '==', organizationId)
        );
        const servicesSnapshot = await getDocs(servicesQuery);
        const totalServices = servicesSnapshot.size;

        // Get today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppointmentsQuery = query(
            collection(db, 'appointments'),
            where('organizationId', '==', organizationId),
            where('appointmentDate', '==', today)
        );
        const todayAppointmentsSnapshot = await getDocs(todayAppointmentsQuery);
        const appointments = todayAppointmentsSnapshot.docs.map(doc => doc.data());

        const appointmentsToday = appointments.length;
        const completed = appointments.filter(a => a.status === 'COMPLETED').length;
        const inProgress = appointments.filter(a => a.status === 'IN_PROGRESS').length;
        const pending = appointments.filter(a => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length;
        const noShows = appointments.filter(a => a.status === 'NO_SHOW').length;

        // Calculate average wait time
        const waitTimes = appointments
            .filter(a => a.estimatedWaitTime)
            .map(a => a.estimatedWaitTime);
        const avgWait = waitTimes.length > 0
            ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
            : 0;

        return {
            totalEmployees,
            totalServices,
            appointmentsToday,
            completed,
            inProgress,
            pending,
            noShows,
            avgWait,
            queueLength: pending + inProgress
        };
    } catch (error) {
        console.error('Error getting organization stats:', error);
        throw error;
    }
};

/**
 * Get growth data for charts (last 30 days)
 */
export const getGrowthData = async (type = 'organizations') => {
    try {
        const data = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            let count = 0;

            if (type === 'organizations') {
                const q = query(
                    collection(db, 'organizations'),
                    where('createdAt', '<=', Timestamp.fromDate(date))
                );
                const snapshot = await getDocs(q);
                count = snapshot.size;
            } else if (type === 'users') {
                const q = query(
                    collection(db, 'users'),
                    where('createdAt', '<=', Timestamp.fromDate(date))
                );
                const snapshot = await getDocs(q);
                count = snapshot.size;
            }

            data.push({
                date: dateStr,
                count
            });
        }

        return data;
    } catch (error) {
        console.error('Error getting growth data:', error);
        throw error;
    }
};

export default {
    aggregateDailyMetrics,
    getPlatformStats,
    getOrganizationStats,
    getGrowthData
};
