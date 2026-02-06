import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="error-container">
            <div className="error-card">
                <div className="error-icon">🚫</div>
                <h1>Access Denied</h1>
                <p>You do not have permission to access this feature.</p>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    Please contact your organization administrator if you believe this is an error.
                </p>
                <Link to="/" className="btn-primary">
                    Go to Home
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
