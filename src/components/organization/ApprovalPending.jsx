import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component shown when organization is pending admin approval
 */
const ApprovalPending = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleReturnHome = () => {
        navigate('/');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="container fade-in" style={{
            paddingTop: '4rem',
            paddingBottom: '4rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh'
        }}>
            <div className="card-glass" style={{
                maxWidth: '600px',
                textAlign: 'center',
                padding: 'var(--spacing-xl)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>
                    ⏳
                </div>
                <h1 className="gradient-text" style={{ marginBottom: 'var(--spacing-md)' }}>
                    Waiting for Approval
                </h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-lg)',
                    lineHeight: '1.6'
                }}>
                    Your organization registration has been submitted successfully and is currently under review by our admin team.
                </p>

                <div style={{
                    background: 'var(--surface-secondary)',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: 'var(--spacing-lg)',
                    textAlign: 'left'
                }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '1rem' }}>
                        📋 What happens next?
                    </h3>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                    }}>
                        <li style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: 'var(--spacing-xs)' }}>✅</span>
                            <span>Admin will review your organization details</span>
                        </li>
                        <li style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: 'var(--spacing-xs)' }}>📧</span>
                            <span>You'll receive a notification once approved</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: 'var(--spacing-xs)' }}>🎉</span>
                            <span>Full access will be granted after approval</span>
                        </li>
                    </ul>
                </div>

                <div style={{
                    background: 'var(--info-bg)',
                    border: '1px solid var(--info)',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: 'var(--spacing-lg)'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'var(--info)'
                    }}>
                        💡 <strong>Tip:</strong> This process usually takes 24-48 hours. You'll receive an email notification once your organization is approved.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                        className="btn-primary"
                        onClick={handleReturnHome}
                        style={{ flex: 1 }}
                    >
                        Return to Home
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={handleLogout}
                        style={{ flex: 1 }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalPending;
