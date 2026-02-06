import { useState } from 'react';
import FormError from './FormError';

/**
 * PhoneInput Component
 * Phone number input with country code selector
 * Validates exactly 10 digits
 */
const PhoneInput = ({
    value = '',
    onChange,
    onBlur,
    error,
    required = false,
    label = 'Phone Number',
    id = 'phone'
}) => {
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState(value.replace(/^\+\d+\s*/, ''));

    // Common country codes
    const countryCodes = [
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
        { code: '+44', country: 'UK', flag: '🇬🇧' },
        { code: '+971', country: 'UAE', flag: '🇦🇪' },
        { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
        { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
        { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
        { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
        { code: '+977', country: 'Nepal', flag: '🇳🇵' },
        { code: '+86', country: 'China', flag: '🇨🇳' },
    ];

    const handlePhoneChange = (e) => {
        let input = e.target.value;

        // Only allow digits
        input = input.replace(/\D/g, '');

        // Limit to 10 digits
        if (input.length <= 10) {
            setPhoneNumber(input);

            // Call parent onChange with full number
            const fullNumber = input ? `${countryCode} ${input}` : '';
            onChange({
                target: {
                    name: id,
                    value: fullNumber
                }
            });
        }
    };

    const handleCountryCodeChange = (e) => {
        const newCode = e.target.value;
        setCountryCode(newCode);

        // Update full number with new country code
        if (phoneNumber) {
            const fullNumber = `${newCode} ${phoneNumber}`;
            onChange({
                target: {
                    name: id,
                    value: fullNumber
                }
            });
        }
    };

    const handleBlurEvent = () => {
        if (onBlur) {
            onBlur();
        }
    };

    // Only show internal validation if no external error is provided
    const getInternalValidationError = () => {
        // If external error exists, don't show internal validation
        if (error) {
            return null;
        }

        if (required && !phoneNumber) {
            return '❌ Phone number is required.';
        }
        if (phoneNumber && phoneNumber.length > 0 && phoneNumber.length !== 10) {
            return '❌ Phone number must be exactly 10 digits.';
        }
        return null;
    };

    const displayError = error || getInternalValidationError();

    return (
        <div className="form-group">
            <label htmlFor={id}>
                {label} {required && '*'}
            </label>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start'
            }}>
                {/* Country Code Selector */}
                <select
                    value={countryCode}
                    onChange={handleCountryCodeChange}
                    style={{
                        width: '140px',
                        flexShrink: 0
                    }}
                    className={displayError ? 'error' : ''}
                >
                    {countryCodes.map(({ code, country, flag }) => (
                        <option key={code} value={code}>
                            {flag} {code}
                        </option>
                    ))}
                </select>

                {/* Phone Number Input */}
                <div style={{ flex: 1 }}>
                    <input
                        type="tel"
                        id={id}
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        onBlur={handleBlurEvent}
                        placeholder="9876543210"
                        maxLength="10"
                        className={displayError ? 'error' : ''}
                        style={{ width: '100%' }}
                    />

                    {/* Character Counter */}
                    <div style={{
                        fontSize: '0.75rem',
                        color: phoneNumber.length === 10 ? '#4ade80' : '#94a3b8',
                        marginTop: '0.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>
                            {phoneNumber.length === 10 ? '✅ Valid' : `${phoneNumber.length}/10 digits`}
                        </span>
                        {phoneNumber && (
                            <span style={{ color: '#cbd5e1' }}>
                                Full: {countryCode} {phoneNumber}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <FormError error={displayError} />
        </div>
    );
};

export default PhoneInput;
