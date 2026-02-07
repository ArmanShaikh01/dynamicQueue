import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            toast.success('Logged out successfully');
            navigate('/login');
        }
    };

    const getNavLinks = () => {
        if (!userProfile) return [];

        switch (userProfile.role) {
            case 'PLATFORM_ADMIN':
                return [
                    { to: '/admin/platform', label: '🎯 Platform Admin' },
                    { to: '/admin/dashboard', label: '🏠 Dashboard' },
                    { to: '/admin/users', label: '👥 Users' },
                    { to: '/admin/settings', label: '⚙️ Settings' },
                    { to: '/admin/audit-logs', label: '📋 Audit Logs' }
                ];

            case 'ORG_ADMIN':
                return [
                    { to: '/organization/dashboard', label: '🏠 Dashboard' },
                    { to: '/organization/services', label: '️ Services' },
                    { to: '/organization/employees', label: '👥 Employees' },
                    { to: '/organization/queue-monitor', label: '📺 Live Queue' },
                    { to: '/organization/no-show', label: '❌ No-Shows' },
                    { to: '/org-admin/analytics', label: '📊 Analytics' },
                    { to: '/org-admin/audit-logs', label: '📋 Audit Logs' }
                ];

            case 'EMPLOYEE':
                return [
                    { to: '/operator/queue', label: '📊 Queue' },
                    { to: '/operator/scanner', label: '📷 Scanner' }
                ];

            case 'CUSTOMER':
                return [
                    { to: '/customer/search', label: '🔍 Search' },
                    { to: '/customer/appointments', label: '📅 My Appointments' }
                ];

            default:
                return [];
        }
    };

    const navLinks = getNavLinks();

    // Close mobile menu when clicking a link
    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    // Notification Listener
    useEffect(() => {
        if (!userProfile || !userProfile.uid) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userProfile.uid),
            where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const notification = change.doc.data();

                    // Show toast based on notification type
                    toast(notification.message, {
                        icon: notification.title.includes('Turn') ? '🔔' : 'ℹ️',
                        duration: 6000,
                        style: {
                            border: '1px solid var(--primary-color)',
                            padding: '16px',
                            color: 'var(--text-primary)',
                        },
                    });

                    // Mark as read
                    try {
                        await updateDoc(doc(db, 'notifications', change.doc.id), {
                            isRead: true
                        });
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [userProfile]);

    return (
        <nav style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Logo */}
                <h2 style={{
                    margin: 0,
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(1.25rem, 4vw, 1.5rem)'
                }}>
                    Queue Manager
                </h2>

                {/* Desktop Navigation */}
                <div className="mobile-hide" style={{
                    alignItems: 'center',
                    gap: '2rem'
                }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all var(--transition-base)',
                                    color: 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--bg-tertiary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {userProfile?.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {userProfile?.role?.replace('_', ' ')}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="btn-outline"
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="desktop-hide"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '44px',
                        minHeight: '44px'
                    }}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div
                    className="desktop-hide"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border)',
                        padding: 'var(--spacing-md)',
                        animation: 'slideIn 0.3s ease-out',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    {/* User Info */}
                    <div style={{
                        padding: 'var(--spacing-md)',
                        borderBottom: '1px solid var(--border)',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {userProfile?.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {userProfile?.role?.replace('_', ' ')}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={handleLinkClick}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    transition: 'all var(--transition-base)',
                                    minHeight: '44px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                        }}
                        className="btn-outline"
                        style={{
                            width: '100%',
                            padding: 'var(--spacing-md)',
                            fontSize: '1rem',
                            minHeight: '44px'
                        }}
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

