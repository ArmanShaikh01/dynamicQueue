import { format, parse, addMinutes, isAfter, isBefore, isEqual, startOfDay, endOfDay } from 'date-fns';

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
    return format(date, 'yyyy-MM-dd');
};

/**
 * Format time to HH:mm
 */
export const formatTime = (date) => {
    return format(date, 'HH:mm');
};

/**
 * Format timestamp to readable date and time
 */
export const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy hh:mm a');
};

/**
 * Parse time string (HH:mm) to Date object
 */
export const parseTime = (timeString, baseDate = new Date()) => {
    return parse(timeString, 'HH:mm', baseDate);
};

/**
 * Calculate time difference in minutes
 */
export const getMinutesDifference = (startTime, endTime) => {
    const start = typeof startTime === 'string' ? parseTime(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseTime(endTime) : endTime;
    return Math.floor((end - start) / (1000 * 60));
};

/**
 * Add minutes to a time string
 */
export const addMinutesToTime = (timeString, minutes) => {
    const time = parseTime(timeString);
    const newTime = addMinutes(time, minutes);
    return formatTime(newTime);
};

/**
 * Check if time is between start and end
 */
export const isTimeBetween = (time, start, end) => {
    const timeDate = typeof time === 'string' ? parseTime(time) : time;
    const startDate = typeof start === 'string' ? parseTime(start) : start;
    const endDate = typeof end === 'string' ? parseTime(end) : end;

    return (isAfter(timeDate, startDate) || isEqual(timeDate, startDate)) &&
        (isBefore(timeDate, endDate) || isEqual(timeDate, endDate));
};

/**
 * Get day name from date
 */
export const getDayName = (date) => {
    return format(date, 'EEEE').toLowerCase();
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
};

/**
 * Get time slots between start and end with interval
 */
export const generateTimeSlots = (startTime, endTime, intervalMinutes) => {
    const slots = [];
    let current = parseTime(startTime);
    const end = parseTime(endTime);

    while (isBefore(current, end)) {
        slots.push(formatTime(current));
        current = addMinutes(current, intervalMinutes);
    }

    return slots;
};
