import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { isValidServiceTime } from '../../utils/validators';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ServiceManagement = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, serviceId: null });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        averageServiceTime: 30,
        staffCount: 1,
        overbookingLimit: 0,
        isActive: true,
        workingHours: {
            monday: { start: '09:00', end: '17:00', isOpen: true },
            tuesday: { start: '09:00', end: '17:00', isOpen: true },
            wednesday: { start: '09:00', end: '17:00', isOpen: true },
            thursday: { start: '09:00', end: '17:00', isOpen: true },
            friday: { start: '09:00', end: '17:00', isOpen: true },
            saturday: { start: '09:00', end: '13:00', isOpen: true },
            sunday: { start: '00:00', end: '00:00', isOpen: false }
        },
        breaks: [],
        slotDuration: 30
    });
    const [breakForm, setBreakForm] = useState({ start: '13:00', end: '15:00', label: 'Lunch Break' });

    useEffect(() => {
        if (!userProfile?.organizationId) return;

        // Real-time listener for services
        const q = query(
            collection(db, 'services'),
            where('organizationId', '==', userProfile.organizationId)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const servicesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServices(servicesData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching services:', error);
                toast.error('Failed to load services');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userProfile]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleWorkingHoursChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            workingHours: {
                ...prev.workingHours,
                [day]: {
                    ...prev.workingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const addBreak = () => {
        if (!breakForm.start || !breakForm.end || !breakForm.label) {
            toast.error('Please fill in all break details');
            return;
        }
        setFormData(prev => ({
            ...prev,
            breaks: [...prev.breaks, { ...breakForm }]
        }));
        setBreakForm({ start: '', end: '', label: '' });
        toast.success('Break added');
    };

    const removeBreak = (index) => {
        setFormData(prev => ({
            ...prev,
            breaks: prev.breaks.filter((_, i) => i !== index)
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Service name is required');
            return;
        }

        if (!isValidServiceTime(formData.averageServiceTime)) {
            toast.error('Service time must be between 1 and 480 minutes');
            return;
        }

        if (formData.staffCount < 1) {
            toast.error('Staff count must be at least 1');
            return;
        }

        try {
            const serviceData = {
                ...formData,
                organizationId: userProfile.organizationId,
                averageServiceTime: Number(formData.averageServiceTime),
                staffCount: Number(formData.staffCount),
                overbookingLimit: Number(formData.overbookingLimit),
                updatedAt: serverTimestamp()
            };

            console.log('Saving service...', editingService ? 'UPDATE' : 'CREATE');
            console.log('Service data:', serviceData);

            if (editingService) {
                console.log('Updating service ID:', editingService.id);
                await updateDoc(doc(db, 'services', editingService.id), serviceData);
                console.log('Service updated successfully');
                toast.success('Service updated successfully');
            } else {
                console.log('Creating new service...');
                const docRef = await addDoc(collection(db, 'services'), {
                    ...serviceData,
                    createdAt: serverTimestamp()
                });
                console.log('Service created with ID:', docRef.id);
                toast.success('Service created successfully');
            }

            setFormData({
                name: '',
                description: '',
                averageServiceTime: 30,
                staffCount: 1,
                overbookingLimit: 0,
                isActive: true,
                workingHours: {
                    monday: { start: '09:00', end: '17:00', isOpen: true },
                    tuesday: { start: '09:00', end: '17:00', isOpen: true },
                    wednesday: { start: '09:00', end: '17:00', isOpen: true },
                    thursday: { start: '09:00', end: '17:00', isOpen: true },
                    friday: { start: '09:00', end: '17:00', isOpen: true },
                    saturday: { start: '09:00', end: '13:00', isOpen: true },
                    sunday: { start: '00:00', end: '00:00', isOpen: false }
                },
                breaks: [],
                slotDuration: 30
            });
            setBreakForm({ start: '13:00', end: '15:00', label: 'Lunch Break' });
            setShowForm(false);
            setEditingService(null);
            // Services will update automatically via onSnapshot listener
        } catch (error) {
            console.error('Error saving service:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            toast.error(`Failed to save service: ${error.message}`);
        }
    };

    const handleEdit = (service) => {
        setFormData({
            name: service.name,
            description: service.description || '',
            averageServiceTime: service.averageServiceTime,
            staffCount: service.staffCount,
            overbookingLimit: service.overbookingLimit,
            isActive: service.isActive,
            workingHours: service.workingHours || {
                monday: { start: '09:00', end: '17:00', isOpen: true },
                tuesday: { start: '09:00', end: '17:00', isOpen: true },
                wednesday: { start: '09:00', end: '17:00', isOpen: true },
                thursday: { start: '09:00', end: '17:00', isOpen: true },
                friday: { start: '09:00', end: '17:00', isOpen: true },
                saturday: { start: '09:00', end: '13:00', isOpen: true },
                sunday: { start: '00:00', end: '00:00', isOpen: false }
            },
            breaks: service.breaks || [],
            slotDuration: service.slotDuration || 30
        });
        setEditingService(service);
        setShowForm(true);
    };

    const handleDeleteClick = (serviceId) => {
        setConfirmDialog({ isOpen: true, serviceId });
    };

    const handleDeleteConfirm = async () => {
        const serviceId = confirmDialog.serviceId;
        setConfirmDialog({ isOpen: false, serviceId: null });

        try {
            console.log('Deleting service ID:', serviceId);
            await deleteDoc(doc(db, 'services', serviceId));
            console.log('Service deleted successfully');
            toast.success('Service deleted successfully');
            // Services will update automatically via onSnapshot listener
        } catch (error) {
            console.error('Error deleting service:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            toast.error(`Failed to delete service: ${error.message}`);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            description: '',
            averageServiceTime: 30,
            staffCount: 1,
            overbookingLimit: 0,
            isActive: true,
            workingHours: {
                monday: { start: '09:00', end: '17:00', isOpen: true },
                tuesday: { start: '09:00', end: '17:00', isOpen: true },
                wednesday: { start: '09:00', end: '17:00', isOpen: true },
                thursday: { start: '09:00', end: '17:00', isOpen: true },
                friday: { start: '09:00', end: '17:00', isOpen: true },
                saturday: { start: '09:00', end: '13:00', isOpen: true },
                sunday: { start: '00:00', end: '00:00', isOpen: false }
            },
            breaks: [],
            slotDuration: 30
        });
        setBreakForm({ start: '13:00', end: '15:00', label: 'Lunch Break' });
        setShowForm(false);
        setEditingService(null);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading services...</p>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 className="gradient-text">⚙️ Service Management</h1>
                    <p>Manage your organization's services</p>
                </div>
                <button
                    className="btn-primary touch-target"
                    onClick={() => setShowForm(!showForm)}
                    style={{ width: '100%' }}
                >
                    {showForm ? 'Cancel' : '+ Add Service'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="form-group">
                                <label htmlFor="name">Service Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., General Consultation"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of the service"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-1 grid-md-3">
                                <div className="form-group">
                                    <label htmlFor="averageServiceTime">Avg. Service Time (minutes) *</label>
                                    <input
                                        type="number"
                                        id="averageServiceTime"
                                        name="averageServiceTime"
                                        value={formData.averageServiceTime}
                                        onChange={handleChange}
                                        min="1"
                                        max="480"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="staffCount">Staff Count *</label>
                                    <input
                                        type="number"
                                        id="staffCount"
                                        name="staffCount"
                                        value={formData.staffCount}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="overbookingLimit">Overbooking Limit</label>
                                    <input
                                        type="number"
                                        id="overbookingLimit"
                                        name="overbookingLimit"
                                        value={formData.overbookingLimit}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="slotDuration">Slot Duration (minutes) *</label>
                                <input
                                    type="number"
                                    id="slotDuration"
                                    name="slotDuration"
                                    value={formData.slotDuration}
                                    onChange={handleChange}
                                    min="5"
                                    max="480"
                                    placeholder="30"
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Time duration for each appointment slot
                                </small>
                            </div>

                            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Working Hours</h3>
                            {Object.keys(formData.workingHours).map(day => (
                                <div key={day} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                    <label style={{ minWidth: '100px', textTransform: 'capitalize' }}>{day}</label>
                                    <input
                                        type="checkbox"
                                        checked={formData.workingHours[day].isOpen}
                                        onChange={(e) => handleWorkingHoursChange(day, 'isOpen', e.target.checked)}
                                    />
                                    <span>Open</span>
                                    {formData.workingHours[day].isOpen && (
                                        <>
                                            <input
                                                type="time"
                                                className="form-input"
                                                style={{ width: '120px' }}
                                                value={formData.workingHours[day].start}
                                                onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                                            />
                                            <span>to</span>
                                            <input
                                                type="time"
                                                className="form-input"
                                                style={{ width: '120px' }}
                                                value={formData.workingHours[day].end}
                                                onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}

                            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Breaks</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                {formData.breaks.map((brk, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                        <span style={{ flex: 1 }}>{brk.label}: {brk.start} - {brk.end}</span>
                                        <button type="button" className="btn-danger" onClick={() => removeBreak(index)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Label (e.g., Lunch)"
                                    value={breakForm.label}
                                    onChange={(e) => setBreakForm({ ...breakForm, label: e.target.value })}
                                />
                                <input
                                    type="time"
                                    className="form-input"
                                    value={breakForm.start}
                                    onChange={(e) => setBreakForm({ ...breakForm, start: e.target.value })}
                                />
                                <input
                                    type="time"
                                    className="form-input"
                                    value={breakForm.end}
                                    onChange={(e) => setBreakForm({ ...breakForm, end: e.target.value })}
                                />
                                <button type="button" className="btn-outline" onClick={addBreak}>
                                    + Add Break
                                </button>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                    />
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="card-footer" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button type="submit" className="btn-primary touch-target" style={{ flex: '1', minWidth: '120px' }}>
                                {editingService ? 'Update Service' : 'Create Service'}
                            </button>
                            <button type="button" className="btn-outline touch-target" onClick={handleCancel} style={{ flex: '1', minWidth: '120px' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {services.length === 0 ? (
                <div className="card text-center">
                    <p>No services found. Create your first service to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {services.map(service => (
                        <div key={service.id} className="card">
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '0.5rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <h3 style={{ marginBottom: 0, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>{service.name}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            background: service.isActive ? 'var(--success-gradient)' : 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: 'white'
                                        }}>
                                            {service.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {service.description && (
                                        <p style={{ marginBottom: '1rem' }}>{service.description}</p>
                                    )}

                                    <div className="grid grid-cols-1 grid-md-3" style={{ fontSize: '0.875rem' }}>
                                        <div>
                                            <strong>⏱️ Service Time:</strong> {service.averageServiceTime} min
                                        </div>
                                        <div>
                                            <strong>👥 Staff:</strong> {service.staffCount}
                                        </div>
                                        <div>
                                            <strong>📊 Overbooking:</strong> {service.overbookingLimit}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn-secondary touch-target"
                                        onClick={() => handleEdit(service)}
                                        style={{ flex: '1', minWidth: '100px', padding: '0.75rem 1rem' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn-danger touch-target"
                                        onClick={() => handleDeleteClick(service.id)}
                                        style={{ flex: '1', minWidth: '100px', padding: '0.75rem 1rem' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Service?"
                message="Are you sure you want to delete this service? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmDialog({ isOpen: false, serviceId: null })}
            />
        </div>
    );
};

export default ServiceManagement;
