/**
 * Validation Utility Functions
 * Centralized validation logic for all forms
 */

// Email validation
export const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return 'Email is required';
    }

    const trimmedEmail = email.trim();

    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
        return 'Please enter a valid email address';
    }

    // Check for consecutive dots
    if (trimmedEmail.includes('..')) {
        return 'Email cannot contain consecutive dots';
    }

    return null;
};

// Password validation
export const validatePassword = (password, minLength = 8) => {
    if (!password || !password.trim()) {
        return 'Password is required';
    }

    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters`;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must contain at least one special character (!@#$%^&*...)';
    }

    return null;
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword || !confirmPassword.trim()) {
        return 'Please confirm your password';
    }

    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }

    return null;
};

// Name validation
export const validateName = (name, minLength = 3) => {
    if (!name || !name.trim()) {
        return 'Name is required';
    }

    const trimmedName = name.trim();

    if (trimmedName.length < minLength) {
        return `Name must be at least ${minLength} characters`;
    }

    // Check if name contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(trimmedName)) {
        return 'Name can only contain letters and spaces';
    }

    // Check if name contains at least one letter (not just spaces)
    if (!/[a-zA-Z]/.test(trimmedName)) {
        return 'Name must contain at least one letter';
    }

    return null;
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName} is required`;
    }

    return null;
};

// Numeric validation
export const validateNumeric = (value, fieldName = 'Value', min = 0) => {
    if (value === '' || value === null || value === undefined) {
        return `${fieldName} is required`;
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
        return `${fieldName} must be a number`;
    }

    if (numValue <= min) {
        return `${fieldName} must be greater than ${min}`;
    }

    return null;
};

// Phone number validation
export const validatePhone = (phone, required = false) => {
    if (!phone || !phone.trim()) {
        return required ? 'Phone number is required' : null;
    }

    // Remove country code prefix (e.g., "+91 " or "+1 ")
    // Extract only the phone number part after the country code
    const phoneWithoutCountryCode = phone.replace(/^\+\d+\s*/, '');

    // Remove spaces and dashes from the phone number
    const cleanPhone = phoneWithoutCountryCode.replace(/[\s-]/g, '');

    // Check if it's a valid phone number (10 digits for most countries)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(cleanPhone)) {
        return 'Please enter a valid 10-digit phone number';
    }

    return null;
};

// Contact number validation (supports both mobile and landline)
export const validateContactNumber = (contactNumber, required = false) => {
    if (!contactNumber || !contactNumber.trim()) {
        return required ? 'Contact number is required' : null;
    }

    const trimmed = contactNumber.trim();

    // Check if it's a mobile number (starts with +)
    if (trimmed.startsWith('+')) {
        const phoneWithoutCountryCode = trimmed.replace(/^\+\d+\s*/, '');
        const cleanPhone = phoneWithoutCountryCode.replace(/[\s-]/g, '');

        if (!/^\d{10}$/.test(cleanPhone)) {
            return 'Mobile number must be exactly 10 digits';
        }
        return null;
    }

    // Otherwise, it's a landline number
    // Format: STD-Number or just Number
    // STD: 2-5 digits, Number: 6-8 digits
    const parts = trimmed.split('-');

    if (parts.length === 1) {
        // No STD code, just landline number
        const cleanNumber = parts[0].replace(/\s/g, '');
        if (!/^\d{6,8}$/.test(cleanNumber)) {
            return 'Landline number must be 6-8 digits';
        }
    } else if (parts.length === 2) {
        // STD code + landline number
        const stdCode = parts[0].replace(/\s/g, '');
        const number = parts[1].replace(/\s/g, '');

        if (!/^\d{2,5}$/.test(stdCode)) {
            return 'STD code must be 2-5 digits';
        }
        if (!/^\d{6,8}$/.test(number)) {
            return 'Landline number must be 6-8 digits';
        }
    } else {
        return 'Invalid contact number format';
    }

    return null;
};

// Time range validation
export const validateTimeRange = (startTime, endTime) => {
    if (!startTime) {
        return 'Start time is required';
    }

    if (!endTime) {
        return 'End time is required';
    }

    if (startTime >= endTime) {
        return 'End time must be after start time';
    }

    return null;
};

// Date validation (no past dates)
export const validateFutureDate = (date) => {
    if (!date) {
        return 'Date is required';
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return 'Please select a future date';
    }

    return null;
};

// Organization name validation
export const validateOrganizationName = (name) => {
    if (!name || !name.trim()) {
        return 'Organization name is required';
    }

    if (name.trim().length < 3) {
        return 'Organization name must be at least 3 characters';
    }

    if (name.trim().length > 100) {
        return 'Organization name must not exceed 100 characters';
    }

    return null;
};

// Service name validation
export const validateServiceName = (name) => {
    if (!name || !name.trim()) {
        return 'Service name is required';
    }

    if (name.trim().length < 3) {
        return 'Service name must be at least 3 characters';
    }

    return null;
};

// Service duration validation
export const validateDuration = (duration) => {
    if (!duration || duration === '') {
        return 'Service duration is required';
    }

    const numDuration = Number(duration);

    if (isNaN(numDuration) || numDuration <= 0) {
        return 'Service duration must be greater than 0';
    }

    if (numDuration > 480) {
        return 'Service duration cannot exceed 8 hours (480 minutes)';
    }

    return null;
};

// Price validation
export const validatePrice = (price, required = false) => {
    if (price === '' || price === null || price === undefined) {
        return required ? 'Price is required' : null;
    }

    const numPrice = Number(price);

    if (isNaN(numPrice)) {
        return 'Price must be a number';
    }

    if (numPrice < 0) {
        return 'Price cannot be negative';
    }

    return null;
};

// Address validation
export const validateAddress = (address) => {
    if (!address || !address.trim()) {
        return 'Address is required';
    }

    if (address.trim().length < 10) {
        return 'Please enter a complete address';
    }

    return null;
};

// Description validation
export const validateDescription = (description, minLength = 10, required = false) => {
    if (!description || !description.trim()) {
        return required ? 'Description is required' : null;
    }

    if (description.trim().length < minLength) {
        return `Description must be at least ${minLength} characters`;
    }

    return null;
};

// Role selection validation
export const validateRole = (role) => {
    if (!role) {
        return 'Please select a role';
    }

    return null;
};

// Service selection validation
export const validateServiceSelection = (serviceId) => {
    if (!serviceId) {
        return 'Please select a service';
    }

    return null;
};

// Organization selection validation
export const validateOrganizationSelection = (orgId) => {
    if (!orgId) {
        return 'Please select an organization';
    }

    return null;
};

// Time slot validation
export const validateTimeSlot = (slot) => {
    if (!slot) {
        return 'Please select a time slot';
    }

    return null;
};

// Permissions validation (at least one)
export const validatePermissions = (permissions) => {
    if (!permissions || permissions.length === 0) {
        return 'Please select at least one permission';
    }

    return null;
};

// Form validation helper - validates entire form object
export const validateForm = (formData, validationRules) => {
    const errors = {};

    Object.keys(validationRules).forEach(field => {
        const validator = validationRules[field];
        const error = validator(formData[field], formData);

        if (error) {
            errors[field] = error;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export default {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateName,
    validateRequired,
    validateNumeric,
    validatePhone,
    validateContactNumber,
    validateTimeRange,
    validateFutureDate,
    validateOrganizationName,
    validateServiceName,
    validateDuration,
    validatePrice,
    validateAddress,
    validateDescription,
    validateRole,
    validateServiceSelection,
    validateOrganizationSelection,
    validateTimeSlot,
    validatePermissions,
    validateForm
};
