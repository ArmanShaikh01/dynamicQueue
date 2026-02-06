import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { PERMISSION_CODES } from '../../models/permissions';
import PermissionGuard from '../../components/admin/PermissionGuard';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const QueueMonitor = () => {
    const { userProfile } = useAuth();
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [currentServing, setCurrentServing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, appointmentId: null, title: '', message: '' });

    // Load services
    useEffect(() => {
        if (!userProfile?.organizationId) return;

        const unsubscribe = onSnapshot(
            query(
                collection(db, 'services'),
                where('organizationId', '==', userProfile.organizationId),
                where('isActive', '==', true)
            ),
            (snapshot) => {
                const servicesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServices(servicesData);
                if (servicesData.length > 0 && !selectedService) {
                    setSelectedService(servicesData[0].id);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching services:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userProfile?.organizationId]);

    // Load appointments for selected service
    useEffect(() => {
        if (!selectedService) return;

        const today = new Date().toISOString().split('T')[0];

        const unsubscribe = onSnapshot(
            query(
                collection(db, 'appointments'),
                where('serviceId', '==', selectedService),
                where('appointmentDate', '==', today),
                where('status', 'in', ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS'])
            ),
            (snapshot) => {
                const appointmentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort by token number
                appointmentsData.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

                setAppointments(appointmentsData);

                // Find currently serving
                const serving = appointmentsData.find(a => a.status === 'IN_PROGRESS');
                setCurrentServing(serving);
            },
            (error) => {
                console.error('Error fetching appointments:', error);
            }
        );

        return () => unsubscribe();
    }, [selectedService]);

    const handleSkipTokenClick = (appointmentId) => {
        setConfirmDialog({
            isOpen: true,
            action: 'skip',
            appointmentId,
            title: 'Skip Token?',
            message: 'Are you sure you want to skip this token? This will cancel the appointment.'
        });
    };

    const handleSkipToken = async (appointmentId) => {
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledBy: userProfile.uid,
                cancellationReason: 'Skipped by admin'
            });
            toast.success('Token skipped successfully');
        } catch (error) {
            console.error('Error skipping token:', error);
            toast.error('Failed to skip token');
        }
    };

    const handlePrioritize = async (appointmentId) => {
        try {
            // Set token number to 0 to move to front
            await updateDoc(doc(db, 'appointments', appointmentId), {
                tokenNumber: 0,
                prioritized: true,
                prioritizedAt: new Date(),
                prioritizedBy: userProfile.uid
            });
            toast.success('Token prioritized successfully');
        } catch (error) {
            console.error('Error prioritizing token:', error);
            toast.error('Failed to prioritize token');
        }
    };

    const handleMarkNoShowClick = (appointmentId) => {
        setConfirmDialog({
            isOpen: true,
            action: 'noshow',
            appointmentId,
            title: 'Mark as No-Show?',
            message: 'Are you sure you want to mark this appointment as no-show? This action will be recorded.'
        });
    };

    const handleMarkNoShow = async (appointmentId) => {
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'NO_SHOW',
                noShowAt: new Date(),
                markedBy: userProfile.uid
            });
            toast.success('Marked as no-show');
        } catch (error) {
            console.error('Error marking no-show:', error);
            toast.error('Failed to mark as no-show');
        }
    };

    const handleConfirmAction = async () => {
        const { action, appointmentId } = confirmDialog;
        setConfirmDialog({ isOpen: false, action: null, appointmentId: null, title: '', message: '' });

        if (action === 'skip') {
            await handleSkipToken(appointmentId);
        } else if (action === 'noshow') {
            await handleMarkNoShow(appointmentId);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading queue monitor...</p>
            </div>
        );
    }

    const selectedServiceData = services.find(s => s.id === selectedService);
    const queueLength = appointments.filter(a => a.status !== 'IN_PROGRESS').length;

    return (
        <PermissionGuard permission={PERMISSION_CODES.ORG_MANAGE_QUEUE} redirect>
            <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="gradient-text">📺 Live Queue Monitor</h1>
                <p>Monitor and manage your service queues in real-time</p>

                {/* Service Selector */}
                <div className="card-glass" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '600' }}>
                        Select Service
                    </label>
                    <select
                        value={selectedService || ''}
                        onChange={(e) => setSelectedService(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedServiceData && (
                    <>
                        {/* Current Serving */}
                        <div className="card-glass glass-strong" style={{ marginBottom: '2rem' }}>
                            <h2>Currently Serving</h2>
                            {currentServing ? (
                                <div style={{
                                    padding: 'var(--spacing-lg)',
                                    background: 'var(--primary-gradient)',
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: 'var(--spacing-sm)' }}>
                                        Token #{currentServing.tokenNumber}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                                        👤 {currentServing.customerName}
                                    </div>
                                    {currentServing.customerPhone && (
                                        <div style={{ fontSize: '1rem', opacity: 0.95, marginBottom: '0.25rem' }}>
                                            📞 {currentServing.customerPhone}
                                        </div>
                                    )}
                                    {currentServing.customerEmail && (
                                        <div style={{ fontSize: '1rem', opacity: 0.95, marginBottom: 'var(--spacing-sm)' }}>
                                            ✉️ {currentServing.customerEmail}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: 'var(--spacing-sm)' }}>
                                        🕒 {currentServing.appointmentTime}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                                    No customer currently being served
                                </div>
                            )}
                        </div>

                        {/* Queue Status */}
                        <div className="card-glass" style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                <h2 style={{ margin: 0 }}>Queue Status</h2>
                                <div className="badge badge-primary" style={{ fontSize: '1rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                    {queueLength} waiting
                                </div>
                            </div>

                            {appointments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                                    No appointments in queue
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                                    {appointments.map((appointment, index) => (
                                        <div
                                            key={appointment.id}
                                            className={`glass ${appointment.status === 'IN_PROGRESS' ? 'glass-strong' : ''}`}
                                            style={{
                                                padding: 'var(--spacing-md)',
                                                borderLeft: appointment.status === 'IN_PROGRESS'
                                                    ? '4px solid var(--primary)'
                                                    : appointment.prioritized
                                                        ? '4px solid var(--warning)'
                                                        : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                                        <div style={{
                                                            fontSize: '1.5rem',
                                                            fontWeight: '700',
                                                            color: appointment.status === 'IN_PROGRESS' ? 'var(--primary)' : 'inherit'
                                                        }}>
                                                            #{appointment.tokenNumber}
                                                        </div>
                                                        {appointment.prioritized && (
                                                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                                                                ⚡ Priority
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Customer Info */}
                                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: 'var(--spacing-xs)' }}>
                                                            👤 {appointment.customerName}
                                                        </div>
                                                        {appointment.customerPhone && (
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                                📞 {appointment.customerPhone}
                                                            </div>
                                                        )}
                                                        {appointment.customerEmail && (
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                                ✉️ {appointment.customerEmail}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        🕒 Scheduled: {appointment.appointmentTime}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                                        Status: <span className={`badge badge-${appointment.status === 'IN_PROGRESS' ? 'primary' :
                                                            appointment.status === 'CHECKED_IN' ? 'success' :
                                                                'warning'
                                                            }`} style={{ fontSize: '0.7rem' }}>
                                                            {appointment.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Admin Actions */}
                                                <PermissionGuard permission={PERMISSION_CODES.ORG_OVERRIDE_QUEUE}>
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                                        {appointment.status !== 'IN_PROGRESS' && !appointment.prioritized && (
                                                            <button
                                                                onClick={() => handlePrioritize(appointment.id)}
                                                                className="btn-secondary"
                                                                style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                                            >
                                                                ⚡ Prioritize
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleSkipTokenClick(appointment.id)}
                                                            className="btn-danger"
                                                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                                        >
                                                            ⏭️ Skip
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkNoShowClick(appointment.id)}
                                                            className="btn-danger"
                                                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                                        >
                                                            ❌ No-Show
                                                        </button>
                                                    </div>
                                                </PermissionGuard>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText="Confirm"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmDialog({ isOpen: false, action: null, appointmentId: null, title: '', message: '' })}
            />
        </PermissionGuard>
    );
};

export default QueueMonitor;
