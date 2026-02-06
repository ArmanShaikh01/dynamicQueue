import { useState } from 'react';
import FormError from './FormError';

/**
 * PasswordInput Component
 * Password input with show/hide toggle
 */
const PasswordInput = ({
    id = 'password',
    name = 'password',
    value = '',
    onChange,
    onBlur,
    error,
    placeholder = 'Enter password',
    label = 'Password',
    required = false,
    autoComplete = 'new-password',
    children // For additional content like PasswordStrengthIndicator
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="form-group">
            <label htmlFor={id}>
                {label} {required && '*'}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className={error ? 'error' : ''}
                    style={{ paddingRight: '2.5rem' }}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '1.25rem',
                        transition: 'color 0.2s ease',
                        outline: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? (
                        // Eye slash icon (hide)
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                    ) : (
                        // Eye icon (show)
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>
            <FormError error={error} />
            {children}
        </div>
    );
};

export default PasswordInput;
