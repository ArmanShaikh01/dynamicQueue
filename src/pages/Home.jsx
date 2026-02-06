import { Link } from 'react-router-dom';
import './Home.css';

/**
 * Home / Landing Page
 * Public page explaining the platform
 */
const Home = () => {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Dynamic Queue & Appointment
                        <span className="gradient-text"> Management System</span>
                    </h1>
                    <p className="hero-subtitle">
                        A real-time platform to manage appointments and queues efficiently
                    </p>
                    <div className="hero-cta">
                        <Link to="/signup?role=customer" className="btn-primary-cta">
                            📅 Book Appointment
                        </Link>
                        <Link to="/signup?role=org_admin" className="btn-secondary-cta">
                            🏢 Register Organization
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <div className="stat-number">Real-time</div>
                            <div className="stat-label">Queue Tracking</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">QR-based</div>
                            <div className="stat-label">Check-in System</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">Multi-org</div>
                            <div className="stat-label">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="section-container">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">
                        Simple 4-step process to get started
                    </p>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">🏢</div>
                            <h3 className="step-title">Organization Registers</h3>
                            <p className="step-description">
                                Hospitals, clinics, or service centers create an account and set up their profile
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">⚙️</div>
                            <h3 className="step-title">Configure Services</h3>
                            <p className="step-description">
                                Define services, set time slots, and configure queue parameters
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">📱</div>
                            <h3 className="step-title">Customers Book</h3>
                            <p className="step-description">
                                Users search for organizations, select services, and book appointments online
                            </p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">4</div>
                            <div className="step-icon">✅</div>
                            <h3 className="step-title">Operator Manages</h3>
                            <p className="step-description">
                                Staff scan QR codes for check-in and manage the live queue in real-time
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Features Section */}
            <section id="features" className="features-section">
                <div className="section-container">
                    <h2 className="section-title">Key Features</h2>
                    <p className="section-subtitle">
                        Everything you need to manage queues and appointments
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">⏱️</div>
                            <h3 className="feature-title">Real-time Queue Tracking</h3>
                            <p className="feature-description">
                                Live updates on queue status, wait times, and position tracking
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📲</div>
                            <h3 className="feature-title">QR Code Check-in</h3>
                            <p className="feature-description">
                                Operator-controlled QR scanning for secure and fast check-ins
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🗓️</div>
                            <h3 className="feature-title">Dynamic Slot Generation</h3>
                            <p className="feature-description">
                                Automatically generate time slots based on service duration
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🏢</div>
                            <h3 className="feature-title">Multi-Organization</h3>
                            <p className="feature-description">
                                Support for multiple organizations with isolated data
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">👥</div>
                            <h3 className="feature-title">Role-based Access</h3>
                            <p className="feature-description">
                                Admin, organization, employee, and customer roles with permissions
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3 className="feature-title">Analytics Dashboard</h3>
                            <p className="feature-description">
                                Insights on appointments, no-shows, and queue performance
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🚫</div>
                            <h3 className="feature-title">No-Show Management</h3>
                            <p className="feature-description">
                                Track and manage no-shows with automated penalties and restrictions
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔔</div>
                            <h3 className="feature-title">Appointment Reminders</h3>
                            <p className="feature-description">
                                Automated notifications and reminders for upcoming appointments
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who Can Use Section */}
            <section id="who-can-use" className="who-can-use-section">
                <div className="section-container">
                    <h2 className="section-title">Who Can Use This?</h2>
                    <p className="section-subtitle">
                        Perfect for any organization managing appointments and queues
                    </p>

                    <div className="use-cases-grid">
                        <div className="use-case-card">
                            <div className="use-case-icon">🏥</div>
                            <h3 className="use-case-title">Hospitals & Clinics</h3>
                            <p className="use-case-description">
                                Manage patient appointments, reduce waiting times, and streamline check-ins
                            </p>
                        </div>

                        <div className="use-case-card">
                            <div className="use-case-icon">🏛️</div>
                            <h3 className="use-case-title">Government Offices</h3>
                            <p className="use-case-description">
                                Handle citizen services efficiently with organized queues and appointments
                            </p>
                        </div>

                        <div className="use-case-card">
                            <div className="use-case-icon">🏦</div>
                            <h3 className="use-case-title">Banks & Service Centers</h3>
                            <p className="use-case-description">
                                Optimize customer service with scheduled appointments and queue management
                            </p>
                        </div>

                        <div className="use-case-card">
                            <div className="use-case-icon">🎓</div>
                            <h3 className="use-case-title">Colleges & Universities</h3>
                            <p className="use-case-description">
                                Manage student consultations, lab bookings, and administrative services
                            </p>
                        </div>

                        <div className="use-case-card">
                            <div className="use-case-icon">💇</div>
                            <h3 className="use-case-title">Salons & Spas</h3>
                            <p className="use-case-description">
                                Book beauty and wellness appointments with real-time availability
                            </p>
                        </div>

                        <div className="use-case-card">
                            <div className="use-case-icon">🍽️</div>
                            <h3 className="use-case-title">Restaurants & Cafes</h3>
                            <p className="use-case-description">
                                Manage table reservations and reduce customer wait times
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="footer-icon">📋</span>
                        <span className="footer-name">QueueFlow</span>
                    </div>
                    <p className="footer-tagline">
                        Dynamic Queue & Appointment Management System
                    </p>
                    <p className="footer-info">
                        A project for efficient queue and appointment management
                    </p>
                    <div className="footer-links">
                        <Link to="/login" className="footer-link">Login</Link>
                        <span className="footer-separator">•</span>
                        <Link to="/signup" className="footer-link">Sign Up</Link>
                        <span className="footer-separator">•</span>
                        <a href="#features" className="footer-link">Features</a>
                    </div>
                    <p className="footer-copyright">
                        © 2026 QueueFlow. Built for demonstration purposes.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
