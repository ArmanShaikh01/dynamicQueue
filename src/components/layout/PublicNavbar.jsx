import { Link } from 'react-router-dom';
import './PublicNavbar.css';

/**
 * PublicNavbar Component
 * Navigation header for unauthenticated users
 */
const PublicNavbar = () => {
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="public-navbar">
            <div className="public-navbar-container">
                {/* Logo/Brand */}
                <div className="public-navbar-brand">
                    <span className="brand-icon">📋</span>
                    <span className="brand-name">QueueFlow</span>
                </div>

                {/* Navigation Links */}
                <div className="public-navbar-links">
                    <button
                        onClick={() => scrollToSection('features')}
                        className="nav-link"
                    >
                        Features
                    </button>
                    <button
                        onClick={() => scrollToSection('how-it-works')}
                        className="nav-link"
                    >
                        How It Works
                    </button>
                    <button
                        onClick={() => scrollToSection('who-can-use')}
                        className="nav-link"
                    >
                        Use Cases
                    </button>
                </div>

                {/* Auth Buttons */}
                <div className="public-navbar-actions">
                    <Link to="/login" className="btn-login">
                        Login
                    </Link>
                    <Link to="/signup" className="btn-signup">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default PublicNavbar;
