import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { validateOrganizationName, validateEmail, validatePhone, validateAddress } from '../../utils/validation';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorMapper';
import FormError from '../../components/common/FormError';
import PhoneInput from '../../components/common/PhoneInput';

const OrganizationSetup = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        type: 'hospital',
        description: '',
        email: '',
        phone: '',
        address: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    // Field-level validation on blur
    const handleBlur = (field) => {
        let error = null;

        switch (field) {
            case 'name':
                error = validateOrganizationName(formData.name);
                break;
            case 'email':
                error = validateEmail(formData.email);
                break;
            case 'phone':
                error = validatePhone(formData.phone, true);
                break;
            case 'address':
                error = validateAddress(formData.address);
                break;
            default:
                break;
        }

        if (error) {
            setErrors({ ...errors, [field]: error });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const nameError = validateOrganizationName(formData.name);
        const emailError = validateEmail(formData.email);
        const phoneError = validatePhone(formData.phone, true);
        const addressError = validateAddress(formData.address);

        if (nameError || emailError || phoneError || addressError) {
            setErrors({
                name: nameError,
                email: emailError,
                phone: phoneError,
                address: addressError
            });
            toast.error('Please fix the errors before submitting');
            return;
        }

        setLoading(true);

        try {
            // Create organization
            const orgRef = await addDoc(collection(db, 'organizations'), {
                name: formData.name.trim(),
                type: formData.type,
                description: formData.description.trim(),
                contact: {
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    address: formData.address.trim()
                },
                isApproved: false, // Requires platform admin approval
                isActive: true,
                adminId: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            const organizationId = orgRef.id;

            // Update user profile with organizationId
            await updateDoc(doc(db, 'users', currentUser.uid), {
                organizationId: organizationId,
                updatedAt: serverTimestamp()
            });

            toast.success('Organization created successfully! Awaiting admin approval.');
            navigate('/organization/dashboard');
        } catch (error) {
            console.error('Error creating organization:', error);
            const errorMessage = getFirebaseErrorMessage(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div className="card-header">
                    <h2>Setup Your Organization</h2>
                    <p>Provide details about your organization to get started</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="card-body">
                        {/* Basic Information */}
                        <h3>Basic Information</h3>

                        <div className="form-group">
                            <label htmlFor="name">Organization Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={() => handleBlur('name')}
                                placeholder="Enter organization name"
                                className={errors.name ? 'error' : ''}
                            />
                            <FormError error={errors.name} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="type">Organization Type *</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <option value="hospital">Hospital</option>
                                <option value="clinic">Clinic</option>
                                <option value="office">Office</option>
                                <option value="service_center">Service Center</option>
                                <option value="government">Government Office</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Brief description of your organization"
                                rows="3"
                            />
                        </div>

                        {/* Contact Information */}
                        <h3 style={{ marginTop: '2rem' }}>Contact Information</h3>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => handleBlur('email')}
                                placeholder="contact@organization.com"
                                className={errors.email ? 'error' : ''}
                            />
                            <FormError error={errors.email} />
                        </div>

                        <PhoneInput
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={() => handleBlur('phone')}
                            error={errors.phone}
                            required={true}
                            label="Phone"
                        />

                        <div className="form-group">
                            <label htmlFor="address">Address *</label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                onBlur={() => handleBlur('address')}
                                placeholder="Full address"
                                rows="2"
                                className={errors.address ? 'error' : ''}
                            />
                            <FormError error={errors.address} />
                        </div>
                    </div>

                    <div className="card-footer">
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Creating Organization...' : 'Create Organization'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrganizationSetup;
