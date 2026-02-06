import { useState, useEffect } from 'react';

/**
 * PasswordStrengthIndicator Component
 * Shows real-time password strength and requirements
 */
const PasswordStrengthIndicator = ({ password }) => {
    const [strength, setStrength] = useState({
        score: 0,
        label: '',
        color: '',
        checks: {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false
        }
    });

    useEffect(() => {
        if (!password) {
            setStrength({
                score: 0,
                label: '',
                color: '',
                checks: {
                    length: false,
                    uppercase: false,
                    lowercase: false,
                    number: false,
                    special: false
                }
            });
            return;
        }

        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;

        let label = '';
        let color = '';

        if (score === 0) {
            label = '';
            color = '';
        } else if (score <= 2) {
            label = 'Weak';
            color = '#ef4444'; // red
        } else if (score === 3 || score === 4) {
            label = 'Medium';
            color = '#f59e0b'; // orange
        } else {
            label = 'Strong';
            color = '#10b981'; // green
        }

        setStrength({ score, label, color, checks });
    }, [password]);

    if (!password) return null;

    return (
        <div style={{
            marginTop: '0.75rem',
            fontSize: '0.875rem'
        }}>
            {/* Strength Bar */}
            {strength.label && (
                <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                    }}>
                        <span style={{ color: '#94a3b8' }}>Password Strength:</span>
                        <span style={{
                            color: strength.color,
                            fontWeight: '600'
                        }}>
                            {strength.label}
                        </span>
                    </div>
                    <div style={{
                        height: '4px',
                        backgroundColor: 'rgba(148, 163, 184, 0.2)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${(strength.score / 5) * 100}%`,
                            backgroundColor: strength.color,
                            transition: 'all 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Requirements Checklist */}
            <div style={{
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
                <div style={{
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                }}>
                    Password must contain:
                </div>
                <div style={{
                    display: 'grid',
                    gap: '0.25rem'
                }}>
                    <RequirementItem
                        met={strength.checks.length}
                        text="At least 8 characters"
                    />
                    <RequirementItem
                        met={strength.checks.uppercase}
                        text="One uppercase letter (A-Z)"
                    />
                    <RequirementItem
                        met={strength.checks.lowercase}
                        text="One lowercase letter (a-z)"
                    />
                    <RequirementItem
                        met={strength.checks.number}
                        text="One number (0-9)"
                    />
                    <RequirementItem
                        met={strength.checks.special}
                        text="One special character (!@#$%...)"
                    />
                </div>
            </div>
        </div>
    );
};

const RequirementItem = ({ met, text }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.75rem',
        color: met ? '#10b981' : '#94a3b8'
    }}>
        <span style={{
            fontSize: '0.875rem',
            fontWeight: '600'
        }}>
            {met ? '✓' : '○'}
        </span>
        <span>{text}</span>
    </div>
);

export default PasswordStrengthIndicator;
