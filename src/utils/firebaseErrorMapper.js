/**
 * Firebase Error Mapper
 * Maps Firebase error codes to user-friendly messages in English
 */

export const firebaseErrorMessages = {
    // ============================================
    // AUTHENTICATION ERRORS - Login/Signup
    // ============================================

    // Email related
    'auth/invalid-email': '❌ Email address is in incorrect format. Please enter a valid email.',
    'auth/user-not-found': '❌ No account found with this email. Please sign up first.',
    'auth/email-already-in-use': '❌ This email is already registered. Please login or use a different email.',

    // Password related
    'auth/wrong-password': '❌ Incorrect password. Please try again or reset your password.',
    'auth/weak-password': '❌ Password is too weak. Please use at least 6 characters.',
    'auth/missing-password': '❌ Password is required.',

    // Credential related
    'auth/invalid-credential': '❌ Email or password is incorrect. Please check your details and try again.',
    'auth/invalid-login-credentials': '❌ Login credentials are incorrect. Please check your email and password.',
    'auth/user-disabled': '❌ Your account has been disabled. Please contact support.',

    // Rate limiting & Security
    'auth/too-many-requests': '⏳ Too many failed attempts. Please wait a few minutes and try again.',
    'auth/operation-not-allowed': '❌ This sign-in method is not enabled. Please contact admin.',
    'auth/requires-recent-login': '🔒 For security reasons, please logout and login again.',
    'auth/account-exists-with-different-credential': '⚠️ An account already exists with this email using a different method. Please use that method.',

    // Network & Connection
    'auth/network-request-failed': '🌐 Network connection problem. Please check your internet and try again.',
    'auth/timeout': '⏰ Request timed out. Please check your internet and try again.',

    // Token & Session
    'auth/invalid-api-key': '❌ App configuration error. Please contact admin.',
    'auth/app-deleted': '❌ App configuration has been deleted. Please contact admin.',
    'auth/invalid-user-token': '🔒 Your session has expired. Please login again.',
    'auth/user-token-expired': '🔒 Login session has expired. Please login again.',

    // Additional auth errors
    'auth/popup-blocked': '🚫 Popup was blocked. Please allow popups in browser settings.',
    'auth/popup-closed-by-user': '⚠️ You closed the popup. Please try again.',
    'auth/unauthorized-domain': '🚫 This domain is not authorized. Please contact admin.',
    'auth/invalid-action-code': '❌ This link is invalid or has expired.',
    'auth/expired-action-code': '⏰ This link has expired. Please request a new one.',

    // ============================================
    // FIRESTORE ERRORS - Database Operations
    // ============================================
    'permission-denied': '🚫 You do not have permission for this action.',
    'not-found': '❓ Requested data not found.',
    'already-exists': '⚠️ This data already exists.',
    'resource-exhausted': '⏳ Too many requests. Please try again later.',
    'failed-precondition': '⚠️ This operation cannot be performed right now. Please try later.',
    'aborted': '⚠️ Operation was cancelled. Please try again.',
    'out-of-range': '❌ Value is out of valid range.',
    'unimplemented': '🚧 This feature is not available yet.',
    'internal': '❌ Internal server error. Please try again or contact support.',
    'unavailable': '⏳ Service is temporarily unavailable. Please try again later.',
    'data-loss': '❌ Data error detected. Please contact support.',
    'unauthenticated': '🔒 Please login first.',
    'cancelled': '⚠️ Request was cancelled.',
    'unknown': '❌ Unknown error occurred. Please try again.',
    'invalid-argument': '❌ Invalid data provided.',
    'deadline-exceeded': '⏰ Request is taking too long. Please try again.',

    // ============================================
    // CUSTOM APPLICATION ERRORS
    // ============================================

    // Appointment errors
    'appointment/already-checked-in': '✅ This appointment has already been checked in.',
    'appointment/expired': '⏰ This appointment has expired.',
    'appointment/not-found': '❓ Appointment not found.',
    'appointment/invalid-qr': '❌ QR code is invalid. Please scan again.',
    'appointment/wrong-organization': '⚠️ This appointment belongs to a different organization.',
    'appointment/cancelled': '❌ This appointment has been cancelled.',
    'appointment/past-time': '⏰ Cannot book appointments for past times.',
    'appointment/slot-full': '⏳ This slot is full. Please select a different time.',

    // Slot errors
    'slot/not-available': '⏰ Selected time slot is not available. Please choose another slot.',
    'slot/already-booked': '⚠️ This slot is already booked. Please select a different time.',
    'slot/outside-hours': '⏰ This time is outside working hours.',

    // Organization errors
    'organization/not-approved': '⏳ Organization approval is pending from admin.',
    'organization/suspended': '🚫 Organization has been suspended. Please contact support.',
    'organization/not-found': '❓ Organization not found.',
    'organization/inactive': '⚠️ Organization is inactive.',

    // Service errors
    'service/inactive': '⚠️ This service is currently inactive.',
    'service/not-found': '❓ Service not found.',
    'service/unavailable': '⏳ Service is temporarily unavailable.',

    // Employee errors
    'employee/not-found': '❓ Employee not found.',
    'employee/inactive': '⚠️ Employee is currently inactive.',
    'employee/not-available': '⏳ Employee is not available right now.',

    // Queue errors
    'queue/full': '⏳ Queue is currently full. Please try again later.',
    'queue/closed': '🔒 Queue is currently closed.',
    'queue/not-started': '⏰ Queue has not started yet.',

    // User errors
    'user/blocked': '🚫 Your account has been blocked. Please contact support.',
    'user/no-show-limit': '⚠️ You have exceeded the no-show limit. Please try again in a few days.',
    'user/invalid-role': '❌ Invalid user role.',
    'user/profile-incomplete': '⚠️ Please complete your profile.',

    // Validation errors
    'validation/invalid-phone': '❌ Phone number is in incorrect format.',
    'validation/invalid-date': '❌ Date is invalid.',
    'validation/invalid-time': '❌ Time is invalid.',
    'validation/required-field': '❌ This field is required.',
    'validation/min-length': '❌ Minimum length requirement not met.',
    'validation/max-length': '❌ Maximum length exceeded.',

    // Default fallback
    'default': '❌ Something went wrong. Please try again or contact support if the problem persists.'
};

/**
 * Get user-friendly error message from Firebase error
 * @param {Error|Object} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export const getFirebaseErrorMessage = (error) => {
    if (!error) {
        return firebaseErrorMessages.default;
    }

    // Handle error code
    const errorCode = error.code || error;

    // Check if we have a mapped message
    if (firebaseErrorMessages[errorCode]) {
        return firebaseErrorMessages[errorCode];
    }

    // Handle error message directly
    if (typeof error === 'string') {
        // Check if it's an error code
        if (firebaseErrorMessages[error]) {
            return firebaseErrorMessages[error];
        }
        return error;
    }

    // Handle error.message
    if (error.message) {
        // Don't show technical Firebase messages
        if (error.message.includes('Firebase') ||
            error.message.includes('firestore') ||
            error.message.includes('auth/')) {
            return firebaseErrorMessages.default;
        }
        return error.message;
    }

    return firebaseErrorMessages.default;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
    const errorCode = error?.code || '';
    return errorCode === 'auth/network-request-failed' ||
        errorCode === 'unavailable' ||
        errorCode === 'auth/timeout' ||
        errorCode.includes('network');
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error) => {
    const errorCode = error?.code || '';
    return errorCode.startsWith('auth/');
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error) => {
    const errorCode = error?.code || '';
    return errorCode === 'permission-denied' || errorCode === 'unauthenticated';
};

/**
 * Get appointment-specific error message
 */
export const getAppointmentError = (errorType) => {
    const key = `appointment/${errorType}`;
    return firebaseErrorMessages[key] || firebaseErrorMessages.default;
};

/**
 * Get QR scan error message
 */
export const getQRScanError = (scanResult) => {
    if (!scanResult || !scanResult.appointmentId) {
        return firebaseErrorMessages['appointment/invalid-qr'];
    }

    if (scanResult.isExpired) {
        return firebaseErrorMessages['appointment/expired'];
    }

    if (scanResult.isCheckedIn) {
        return firebaseErrorMessages['appointment/already-checked-in'];
    }

    if (scanResult.isCancelled) {
        return firebaseErrorMessages['appointment/cancelled'];
    }

    return null; // No error
};

/**
 * Get validation error message
 */
export const getValidationError = (field, type) => {
    const key = `validation/${type}`;
    return firebaseErrorMessages[key] || `❌ Error in ${field}.`;
};

export default {
    firebaseErrorMessages,
    getFirebaseErrorMessage,
    isNetworkError,
    isAuthError,
    isPermissionError,
    getAppointmentError,
    getQRScanError,
    getValidationError
};
