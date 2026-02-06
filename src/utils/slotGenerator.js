import { generateTimeSlots, getMinutesDifference, isTimeBetween } from './dateHelpers';

/**
 * Generate available slots for a service on a specific date
 * @param {Object} params - Parameters for slot generation
 * @param {Object} params.workingHours - Working hours for the day {start, end, isOpen}
 * @param {Array} params.breaks - Array of break times [{start, end, label}]
 * @param {number} params.staffCount - Number of staff members
 * @param {number} params.averageServiceTime - Average service time in minutes
 * @param {number} params.slotDuration - Duration of each slot interval in minutes
 * @param {Array} params.existingBookings - Array of existing appointments
 * @param {number} params.overbookingLimit - Maximum overbooking per slot
 * @returns {Array} Array of available time slots
 */
export const generateAvailableSlots = ({
    workingHours,
    breaks = [],
    staffCount = 1,
    averageServiceTime = 30,
    slotDuration = 30,  // New parameter for slot interval
    existingBookings = [],
    overbookingLimit = 0,
    selectedDate = null  // New parameter to check if booking for today
}) => {
    // Check if organization is open
    if (!workingHours || !workingHours.isOpen) {
        return [];
    }

    const { start, end } = workingHours;

    // Generate all possible time slots using slotDuration
    const allSlots = generateTimeSlots(start, end, slotDuration);

    // Filter out slots that fall within break times
    const slotsWithoutBreaks = allSlots.filter(slot => {
        return !breaks.some(breakTime =>
            isTimeBetween(slot, breakTime.start, breakTime.end)
        );
    });

    // Check if selected date is today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const isToday = selectedDate === todayString;

    // Get current time in HH:MM format
    const currentTime = isToday
        ? `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`
        : null;

    // Calculate capacity for each slot
    const slotsWithCapacity = slotsWithoutBreaks.map(slot => {
        // Count existing bookings for this slot
        const bookingsAtSlot = existingBookings.filter(booking =>
            booking.appointmentTime === slot &&
            booking.status !== 'CANCELLED' &&
            booking.status !== 'NO_SHOW'
        ).length;

        // Calculate available capacity
        const maxCapacity = staffCount + overbookingLimit;
        const availableCapacity = maxCapacity - bookingsAtSlot;

        // Check if slot is in the past (only for today)
        const isPastSlot = isToday && currentTime && slot <= currentTime;

        return {
            time: slot,
            capacity: availableCapacity,
            isAvailable: availableCapacity > 0 && !isPastSlot, // Disable if past time or no capacity
            bookingsCount: bookingsAtSlot,
            maxCapacity,
            isPast: isPastSlot // Add flag to indicate past slot
        };
    });

    return slotsWithCapacity;
};

/**
 * Calculate total available slots for a day
 */
export const calculateTotalSlots = (workingHours, breaks, averageServiceTime) => {
    if (!workingHours || !workingHours.isOpen) {
        return 0;
    }

    const totalMinutes = getMinutesDifference(workingHours.start, workingHours.end);

    // Subtract break times
    const breakMinutes = breaks.reduce((total, breakTime) => {
        return total + getMinutesDifference(breakTime.start, breakTime.end);
    }, 0);

    const availableMinutes = totalMinutes - breakMinutes;
    return Math.floor(availableMinutes / averageServiceTime);
};

/**
 * Validate slot configuration
 */
export const validateSlotConfig = (config) => {
    const errors = [];

    if (!config.averageServiceTime || config.averageServiceTime < 1) {
        errors.push('Average service time must be at least 1 minute');
    }

    if (config.staffCount < 1) {
        errors.push('Staff count must be at least 1');
    }

    if (config.overbookingLimit < 0) {
        errors.push('Overbooking limit cannot be negative');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Get next available slot
 */
export const getNextAvailableSlot = (slots) => {
    return slots.find(slot => slot.isAvailable);
};

/**
 * Check if a specific time slot is available
 */
export const isSlotAvailable = (slots, time) => {
    const slot = slots.find(s => s.time === time);
    return slot ? slot.isAvailable : false;
};
