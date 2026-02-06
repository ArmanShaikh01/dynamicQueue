/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (basic)
 */
export const isValidPhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
    return password.length >= 6;
};

/**
 * Validate time format (HH:mm)
 */
export const isValidTime = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

/**
 * Validate required field
 */
export const isRequired = (value) => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
};

/**
 * Validate number range
 */
export const isInRange = (value, min, max) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str) => {
    return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate organization name
 */
export const isValidOrganizationName = (name) => {
    return name.length >= 3 && name.length <= 100;
};

/**
 * Validate service time (must be positive)
 */
export const isValidServiceTime = (minutes) => {
    return isInRange(minutes, 1, 480); // 1 minute to 8 hours
};
