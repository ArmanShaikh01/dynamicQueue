import { useState, useEffect } from 'react';
import FormError from './FormError';

/**
 * ContactNumberInput Component
 * Flexible contact number input supporting both mobile and landline numbers
 * - Mobile: Country code + 10 digits
 * - Landline: Optional STD code (2-5 digits) + number (6-8 digits)
 */
const ContactNumberInput = ({
    value = '',
    onChange,
    onBlur,
    error,
    required = false,
    label = 'Contact Number',
    id = 'phone'
}) => {
    // Determine initial type based on value
    const getInitialType = (val) => {
        if (!val) return 'mobile';
        return val.trim().startsWith('+') ? 'mobile' : 'landline';
    };

    const [contactType, setContactType] = useState(getInitialType(value));

    // Mobile number state
    const [countryCode, setCountryCode] = useState('+91');
    const [mobileNumber, setMobileNumber] = useState('');

    // Landline number state
    const [stdCode, setStdCode] = useState('');
    const [landlineNumber, setLandlineNumber] = useState('');

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

    // Parse initial value
    useEffect(() => {
        if (!value) return;

        const trimmedValue = value.trim();

        if (trimmedValue.startsWith('+')) {
            // Mobile number format: +91 9876543210
            const parts = trimmedValue.split(' ');
            if (parts.length >= 2) {
                setCountryCode(parts[0]);
                setMobileNumber(parts.slice(1).join(''));
            }
        } else {
            // Landline format: 022-12345678 or 12345678
            const parts = trimmedValue.split('-');
            if (parts.length === 2) {
                setStdCode(parts[0]);
                setLandlineNumber(parts[1]);
            } else {
                setLandlineNumber(trimmedValue);
            }
        }
    }, []);

    const handleTypeChange = (type) => {
        setContactType(type);

        // Clear the value when switching types
        setMobileNumber('');
        setStdCode('');
        setLandlineNumber('');

        onChange({
            target: {
                name: id,
                value: ''
            }
        });
    };

    const handleMobileNumberChange = (e) => {
        let input = e.target.value;

        // Only allow digits
        input = input.replace(/\D/g, '');

        // Limit to 10 digits
        if (input.length <= 10) {
            setMobileNumber(input);

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
        if (mobileNumber) {
            const fullNumber = `${newCode} ${mobileNumber}`;
            onChange({
                target: {
                    name: id,
                    value: fullNumber
                }
            });
        }
    };

    const handleStdCodeChange = (e) => {
        let input = e.target.value;

        // Only allow digits
        input = input.replace(/\D/g, '');

        // Limit to 5 digits
        if (input.length <= 5) {
            setStdCode(input);
            updateLandlineValue(input, landlineNumber);
        }
    };

    const handleLandlineNumberChange = (e) => {
        let input = e.target.value;

        // Only allow digits
        input = input.replace(/\D/g, '');

        // Limit to 8 digits
        if (input.length <= 8) {
            setLandlineNumber(input);
            updateLandlineValue(stdCode, input);
        }
    };

    const updateLandlineValue = (std, number) => {
        let fullNumber = '';

        if (std && number) {
            fullNumber = `${std}-${number}`;
        } else if (number) {
            fullNumber = number;
        }

        onChange({
            target: {
                name: id,
                value: fullNumber
            }
        });
    };

    const handleBlurEvent = () => {
        if (onBlur) {
            onBlur();
        }
    };

    return (
        <div className="form-group">
            <label htmlFor={id}>
                {label} {required && '*'}
            </label>

            {/* Type Selector */}
            <div style={{
                display: 'flex',
                gap: '1.5rem',
                marginBottom: '0.75rem',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
            }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}>
                    <input
                        type="radio"
                        name={`${id}-type`}
                        value="mobile"
                        checked={contactType === 'mobile'}
                        onChange={() => handleTypeChange('mobile')}
                        style={{ cursor: 'pointer' }}
                    />
                    📱 Mobile Number
                </label>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                }}>
                    <input
                        type="radio"
                        name={`${id}-type`}
                        value="landline"
                        checked={contactType === 'landline'}
                        onChange={() => handleTypeChange('landline')}
                        style={{ cursor: 'pointer' }}
                    />
                    ☎️ Landline Number
                </label>
            </div>

            {/* Mobile Number Input */}
            {contactType === 'mobile' && (
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
                        className={error ? 'error' : ''}
                    >
                        {countryCodes.map(({ code, country, flag }) => (
                            <option key={code} value={code}>
                                {flag} {code}
                            </option>
                        ))}
                    </select>

                    {/* Mobile Number Input */}
                    <div style={{ flex: 1 }}>
                        <input
                            type="tel"
                            id={id}
                            value={mobileNumber}
                            onChange={handleMobileNumberChange}
                            onBlur={handleBlurEvent}
                            placeholder="9876543210"
                            maxLength="10"
                            className={error ? 'error' : ''}
                            style={{ width: '100%' }}
                        />

                        {/* Character Counter */}
                        <div style={{
                            fontSize: '0.75rem',
                            color: mobileNumber.length === 10 ? '#4ade80' : '#94a3b8',
                            marginTop: '0.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                {mobileNumber.length === 10 ? '✅ Valid' : `${mobileNumber.length}/10 digits`}
                            </span>
                            {mobileNumber && (
                                <span style={{ color: '#cbd5e1' }}>
                                    Full: {countryCode} {mobileNumber}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Landline Number Input */}
            {contactType === 'landline' && (
                <div>
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start'
                    }}>
                        {/* STD Code Input */}
                        <div style={{ width: '140px', flexShrink: 0 }}>
                            <input
                                type="tel"
                                value={stdCode}
                                onChange={handleStdCodeChange}
                                placeholder="STD (Optional)"
                                maxLength="5"
                                className={error ? 'error' : ''}
                                style={{ width: '100%' }}
                            />
                            <div style={{
                                fontSize: '0.7rem',
                                color: '#94a3b8',
                                marginTop: '0.25rem'
                            }}>
                                {stdCode ? `${stdCode.length}/5 digits` : '2-5 digits'}
                            </div>
                        </div>

                        {/* Landline Number Input */}
                        <div style={{ flex: 1 }}>
                            <input
                                type="tel"
                                id={id}
                                value={landlineNumber}
                                onChange={handleLandlineNumberChange}
                                onBlur={handleBlurEvent}
                                placeholder="12345678"
                                maxLength="8"
                                className={error ? 'error' : ''}
                                style={{ width: '100%' }}
                            />
                            <div style={{
                                fontSize: '0.75rem',
                                color: landlineNumber.length >= 6 && landlineNumber.length <= 8 ? '#4ade80' : '#94a3b8',
                                marginTop: '0.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>
                                    {landlineNumber.length >= 6 && landlineNumber.length <= 8
                                        ? '✅ Valid'
                                        : `${landlineNumber.length}/6-8 digits`}
                                </span>
                                {(stdCode || landlineNumber) && (
                                    <span style={{ color: '#cbd5e1' }}>
                                        Full: {stdCode && landlineNumber ? `${stdCode}-${landlineNumber}` : landlineNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        marginTop: '0.5rem',
                        fontStyle: 'italic'
                    }}>
                        💡 Examples: 022-12345678, 080-23456789, or just 12345678
                    </div>
                </div>
            )}

            <FormError error={error} />
        </div>
    );
};

export default ContactNumberInput;
