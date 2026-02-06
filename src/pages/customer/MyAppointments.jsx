import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const MyAppointments = () => {
    const { currentUser } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, appointmentId: null });

    useEffect(() => {
        if (!currentUser?.uid) return;

        // Real-time listener for appointments
        const q = query(
            collection(db, 'appointments'),
            where('customerId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            try {
                const appointmentsData = await Promise.all(
                    snapshot.docs.map(async (docSnapshot) => {
                        const data = docSnapshot.data();

                        // Fetch organization and service names
                        const orgDoc = await getDoc(doc(db, 'organizations', data.organizationId));
                        const orgName = orgDoc.exists() ? orgDoc.data().name : 'Unknown';

                        const serviceDoc = await getDoc(doc(db, 'services', data.serviceId));
                        const serviceName = serviceDoc.exists() ? serviceDoc.data().name : 'Unknown';

                        return {
                            id: docSnapshot.id,
                            ...data,
                            organizationName: orgName,
                            serviceName
                        };
                    })
                );

                setAppointments(appointmentsData);
                setLoading(false);
            } catch (error) {
                console.error('Error processing appointments:', error);
                toast.error('Failed to load appointments');
                setLoading(false);
            }
        }, (error) => {
            console.error('Error listening to appointments:', error);
            toast.error('Failed to load appointments');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const getFilteredAppointments = () => {
        const today = new Date().toISOString().split('T')[0];

        switch (filter) {
            case 'upcoming':
                return appointments.filter(apt =>
                    apt.appointmentDate >= today &&
                    apt.status !== 'COMPLETED' &&
                    apt.status !== 'CANCELLED'
                );
            case 'past':
                return appointments.filter(apt =>
                    apt.appointmentDate < today ||
                    apt.status === 'COMPLETED' ||
                    apt.status === 'CANCELLED'
                );
            default:
                return appointments;
        }
    };

    const handleCancelClick = (appointmentId) => {
        setConfirmDialog({ isOpen: true, appointmentId });
    };

    const handleCancelAppointment = async () => {
        const appointmentId = confirmDialog.appointmentId;
        setConfirmDialog({ isOpen: false, appointmentId: null });

        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'CANCELLED',
                updatedAt: serverTimestamp()
            });

            toast.success('Appointment cancelled successfully');
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            toast.error('Failed to cancel appointment');
        }
    };


    const handleRescheduleAppointment = (appointmentId) => {
        // For now, redirect to booking page
        // In future, implement a reschedule modal
        toast('Reschedule feature coming soon! Please cancel and create a new appointment.', {
            icon: 'ℹ️',
            duration: 4000
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'BOOKED': '#667eea',
            'CHECKED_IN': '#f093fb',
            'IN_PROGRESS': '#4facfe',
            'COMPLETED': '#00f2fe',
            'CANCELLED': '#ff6b6b',
            'NO_SHOW': '#ee5a6f'
        };
        return colors[status] || '#718096';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading appointments...</p>
            </div>
        );
    }

    const filteredAppointments = getFilteredAppointments();

    return (
        <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <h1 className="gradient-text">My Appointments</h1>
            <p>View and manage your appointments</p>

            <div className="scroll-x" style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '2px solid var(--border)',
                overflowX: 'auto'
            }}>
                {['upcoming', 'past', 'all'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className="touch-target"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: filter === tab ? '2px solid #667eea' : '2px solid transparent',
                            color: filter === tab ? '#667eea' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: filter === tab ? '600' : '400',
                            textTransform: 'capitalize',
                            marginBottom: '-2px',
                            whiteSpace: 'nowrap',
                            minWidth: 'auto'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {filteredAppointments.length === 0 ? (
                <div className="card-glass text-center fade-in">
                    <p style={{ fontSize: '1.2rem' }}>📅 No {filter !== 'all' ? filter : ''} appointments found</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {filteredAppointments.map((appointment, index) => (
                        <div key={appointment.id} className="card-glass hover-lift fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '1.5rem',
                                alignItems: 'start'
                            }}>
                                <div className="glass-strong" style={{
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <QRCodeSVG
                                        value={appointment.qrCode}
                                        size={150}
                                        level="H"
                                        style={{ maxWidth: '100%', height: 'auto', background: 'white', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
                                    />
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                                        🎫 Token: {appointment.tokenNumber}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '0.5rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <h3 className="gradient-text" style={{ marginBottom: 0, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>{appointment.organizationName}</h3>
                                        <span className="badge" style={{
                                            background: getStatusColor(appointment.status),
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {appointment.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <p style={{ margin: 0 }}><strong>Service:</strong> {appointment.serviceName}</p>
                                        <p style={{ margin: 0 }}><strong>Date:</strong> {appointment.appointmentDate}</p>
                                        <p style={{ margin: 0 }}><strong>Time:</strong> {appointment.appointmentTime}</p>
                                        {appointment.queuePosition > 0 && (
                                            <p style={{ margin: 0 }}><strong>Queue Position:</strong> {appointment.queuePosition}</p>
                                        )}
                                    </div>
                                </div>

                                {appointment.status === 'BOOKED' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            className="btn-secondary touch-target"
                                            style={{ flex: '1', minWidth: '120px', padding: '0.75rem 1rem' }}
                                            onClick={() => handleRescheduleAppointment(appointment.id)}
                                        >
                                            Reschedule
                                        </button>
                                        <button
                                            className="btn-danger touch-target"
                                            style={{ flex: '1', minWidth: '120px', padding: '0.75rem 1rem' }}
                                            onClick={() => handleCancelClick(appointment.id)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Cancel Appointment?"
                message="Are you sure you want to cancel this appointment? This action cannot be undone."
                confirmText="Cancel Appointment"
                cancelText="Keep Appointment"
                type="danger"
                onConfirm={handleCancelAppointment}
                onCancel={() => setConfirmDialog({ isOpen: false, appointmentId: null })}
            />
        </div>
    );
};

export default MyAppointments;
