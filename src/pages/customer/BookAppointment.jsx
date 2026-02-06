import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { generateAvailableSlots } from '../../utils/slotGenerator';
import { getDayName, formatDate } from '../../utils/dateHelpers';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

const BookAppointment = () => {
    const { organizationId } = useParams();
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();

    const [organization, setOrganization] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [appointment, setAppointment] = useState(null);

    useEffect(() => {
        fetchOrganizationAndServices();
    }, [organizationId]);

    useEffect(() => {
        if (selectedService && selectedDate) {
            fetchAvailableSlots();
        }
    }, [selectedService, selectedDate]);

    const fetchOrganizationAndServices = async () => {
        try {
            const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
            if (!orgDoc.exists()) {
                toast.error('Organization not found');
                navigate('/customer/search');
                return;
            }
            setOrganization({ id: orgDoc.id, ...orgDoc.data() });

            const servicesQuery = query(
                collection(db, 'services'),
                where('organizationId', '==', organizationId),
                where('isActive', '==', true)
            );
            const servicesSnapshot = await getDocs(servicesQuery);
            const servicesData = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setServices(servicesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load organization details');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            console.log('Fetching slots for date:', selectedDate);
            console.log('Organization:', organization);
            console.log('Selected service:', selectedService);

            // Validate organization data
            if (!organization) {
                toast.error('Organization data not loaded');
                return;
            }

            if (!selectedService.workingHours) {
                console.error('Service missing workingHours:', selectedService);
                toast.error('Service working hours not configured. Please contact admin.');
                return;
            }

            const dayName = getDayName(new Date(selectedDate));
            console.log('Day name:', dayName);

            const workingHours = selectedService.workingHours[dayName];
            console.log('Working hours for', dayName, ':', workingHours);

            if (!workingHours || !workingHours.isOpen) {
                setAvailableSlots([]);
                toast.error('Service is not available on this day');
                return;
            }

            console.log('Fetching existing appointments...');
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('organizationId', '==', organizationId),
                where('serviceId', '==', selectedService.id),
                where('appointmentDate', '==', selectedDate)
            );
            const appointmentsSnapshot = await getDocs(appointmentsQuery);
            const existingBookings = appointmentsSnapshot.docs.map(doc => doc.data());
            console.log('Existing bookings:', existingBookings.length);

            console.log('Generating slots with params:', {
                workingHours,
                breaks: selectedService.breaks || [],
                staffCount: selectedService.staffCount,
                averageServiceTime: selectedService.averageServiceTime,
                slotDuration: selectedService.slotDuration || 30,
                overbookingLimit: selectedService.overbookingLimit
            });

            const slots = generateAvailableSlots({
                workingHours,
                breaks: selectedService.breaks || [],
                staffCount: selectedService.staffCount,
                averageServiceTime: selectedService.averageServiceTime,
                slotDuration: selectedService.slotDuration || 30,  // Use service's slot duration
                existingBookings,
                overbookingLimit: selectedService.overbookingLimit,
                selectedDate: selectedDate  // Pass selected date to filter past slots
            });

            console.log('Generated slots:', slots.length);
            setAvailableSlots(slots);
        } catch (error) {
            console.error('Error fetching slots:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            toast.error(`Failed to load available slots: ${error.message}`);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }

        if (!currentUser || !userProfile) {
            toast.error('Please login to book appointment');
            return;
        }

        try {
            console.log('Booking appointment...', {
                organizationId,
                serviceId: selectedService.id,
                customerId: currentUser.uid,
                selectedDate,
                selectedSlot
            });

            const appointmentData = {
                organizationId: organizationId,
                serviceId: selectedService.id,
                serviceName: selectedService.name,
                customerId: currentUser.uid,
                customerName: userProfile.name || 'Unknown',
                customerPhone: userProfile.phone || '',
                customerEmail: userProfile.email || currentUser.email || '',
                appointmentDate: selectedDate,
                appointmentTime: selectedSlot.time,
                status: 'BOOKED',
                qrCode: `${organizationId}-${currentUser.uid}-${Date.now()}`,
                tokenNumber: `T${Date.now().toString().slice(-6)}`,
                queuePosition: 0,
                estimatedWaitTime: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('Appointment data:', appointmentData);

            const docRef = await addDoc(collection(db, 'appointments'), appointmentData);

            console.log('Appointment created with ID:', docRef.id);

            setAppointment({
                id: docRef.id,
                ...appointmentData,
                createdAt: new Date(), // For display purposes
                updatedAt: new Date()
            });
            setBookingComplete(true);
            toast.success('Appointment booked successfully!');
        } catch (error) {
            console.error('Error booking appointment:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            toast.error(`Failed to book appointment: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (bookingComplete && appointment) {
        return (
            <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <div className="card-header">
                        <h2>✅ Appointment Confirmed!</h2>
                    </div>

                    <div className="card-body">
                        <div style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '2rem',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <QRCodeSVG
                                value={appointment.qrCode}
                                size={200}
                                level="H"
                                includeMargin={true}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>

                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <h3>Appointment Details</h3>
                            <p><strong>Token Number:</strong> {appointment.tokenNumber}</p>
                            <p><strong>Organization:</strong> {organization.name}</p>
                            <p><strong>Service:</strong> {selectedService.name}</p>
                            <p><strong>Date:</strong> {selectedDate}</p>
                            <p><strong>Time:</strong> {appointment.appointmentTime}</p>
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem'
                        }}>
                            <p style={{ marginBottom: 0 }}>
                                <strong>📱 Save this QR code!</strong> Show it to the operator when you arrive.
                            </p>
                        </div>
                    </div>

                    <div className="card-footer" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary touch-target"
                            onClick={() => navigate('/customer/appointments')}
                            style={{ flex: '1 1 200px', minWidth: '150px' }}
                        >
                            View My Appointments
                        </button>
                        <button
                            className="btn-outline touch-target"
                            onClick={() => navigate('/customer/search')}
                            style={{ flex: '1 1 200px', minWidth: '150px' }}
                        >
                            Book Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card-header">
                    <h2>Book Appointment</h2>
                    <p>{organization?.name}</p>
                </div>

                <div className="card-body">
                    <div style={{ marginBottom: '2rem' }}>
                        <h3>1. Select Service</h3>
                        {services.length === 0 ? (
                            <p>No services available</p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                gap: '1rem'
                            }}>
                                {services.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        style={{
                                            padding: '1rem',
                                            background: selectedService?.id === service.id ? 'var(--primary-gradient)' : 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            transition: 'all var(--transition-base)'
                                        }}
                                    >
                                        <h4 style={{ marginBottom: '0.5rem', color: selectedService?.id === service.id ? 'white' : 'inherit' }}>
                                            {service.name}
                                        </h4>
                                        <p style={{ marginBottom: 0, fontSize: '0.875rem', color: selectedService?.id === service.id ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>
                                            ⏱️ {service.averageServiceTime} minutes
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedService && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3>2. Select Date</h3>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={formatDate(new Date())}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}

                    {selectedService && selectedDate && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3>3. Select Time Slot</h3>
                            {availableSlots.length === 0 ? (
                                <p>No available slots for this date</p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: '0.5rem'
                                }}>
                                    {availableSlots.map(slot => (
                                        <button
                                            key={slot.time}
                                            onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                                            disabled={!slot.isAvailable}
                                            style={{
                                                padding: '0.75rem',
                                                background: selectedSlot?.time === slot.time
                                                    ? 'var(--primary-gradient)'
                                                    : slot.isAvailable
                                                        ? 'var(--bg-tertiary)'
                                                        : 'var(--bg-secondary)',
                                                color: selectedSlot?.time === slot.time || !slot.isAvailable ? 'white' : 'var(--text-primary)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                                                opacity: slot.isAvailable ? 1 : 0.5
                                            }}
                                        >
                                            {slot.time}
                                            <br />
                                            <small style={{ fontSize: '0.7rem' }}>
                                                {slot.capacity} left
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {selectedService && selectedDate && selectedSlot && (
                    <div className="card-footer">
                        <button
                            className="btn-primary"
                            onClick={handleBookAppointment}
                            style={{ width: '100%' }}
                        >
                            Confirm Booking
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookAppointment;
