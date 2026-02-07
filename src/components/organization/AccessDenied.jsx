import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AccessDenied = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
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
                padding: 'var(--spacing-xl)',
                border: '2px solid var(--danger)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>
                    🚫
                </div>
                <h1 style={{
                    color: 'var(--danger)',
                    marginBottom: 'var(--spacing-md)',
                    fontSize: '2rem'
                }}>
                    Access Denied
                </h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-lg)',
                    lineHeight: '1.6'
                }}>
                    Your organization registration has been rejected by our admin team.
                </p>

                <div className="glass" style={{
                    padding: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-sm)' }}>
                        ℹ️ What can you do?
                    </h3>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        textAlign: 'left'
                    }}>
                        <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                            📧 Contact our support team for more information
                        </li>
                        <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                            🔄 Review and resubmit your organization details
                        </li>
                        <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                            💬 Reach out to admin for clarification
                        </li>
                    </ul>
                </div>

                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link to="/" className="btn-secondary">
                        Return to Home
                    </Link>
                    <button onClick={handleLogout} className="btn-danger">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
