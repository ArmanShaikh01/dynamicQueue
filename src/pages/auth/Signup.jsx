import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { validateEmail, validatePassword, validateConfirmPassword, validateName, validatePhone } from '../../utils/validation';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorMapper';
import FormError from '../../components/common/FormError';
import PhoneInput from '../../components/common/PhoneInput';
import PasswordInput from '../../components/common/PasswordInput';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';

const Signup = () => {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');

    // Map URL role to actual role value
    const getRoleFromParam = (param) => {
        if (param === 'customer') return 'CUSTOMER';
        if (param === 'org_admin') return 'ORG_ADMIN';
        return 'CUSTOMER'; // default
    };

    const initialRole = roleParam ? getRoleFromParam(roleParam) : 'CUSTOMER';
    const isRoleLocked = !!roleParam; // Lock role if it came from URL

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: initialRole
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

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
                error = validateName(formData.name);
                break;
            case 'email':
                error = validateEmail(formData.email);
                break;
            case 'phone':
                error = validatePhone(formData.phone, false); // Optional field
                break;
            case 'password':
                error = validatePassword(formData.password);
                break;
            case 'confirmPassword':
                error = validateConfirmPassword(formData.password, formData.confirmPassword);
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
        const nameError = validateName(formData.name);
        const emailError = validateEmail(formData.email);
        const phoneError = validatePhone(formData.phone, false);
        const passwordError = validatePassword(formData.password);
        const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);

        if (nameError || emailError || phoneError || passwordError || confirmPasswordError) {
            setErrors({
                name: nameError,
                email: emailError,
                phone: phoneError,
                password: passwordError,
                confirmPassword: confirmPasswordError
            });
            return;
        }

        setLoading(true);
        const result = await signup(formData.email.trim(), formData.password, {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            role: formData.role
        });
        setLoading(false);

        if (result.success) {
            toast.success('✅ Account created successfully! Redirecting...');

            // Redirect based on role
            if (formData.role === 'ORG_ADMIN') {
                navigate('/organization/setup');
            } else {
                navigate('/customer/search');
            }
        } else {
            // Use Firebase error mapper for user-friendly messages
            const errorMessage = getFirebaseErrorMessage(result.error);
            toast.error(errorMessage, {
                duration: 5000,
                style: {
                    maxWidth: '500px'
                }
            });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join our queue management platform</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                    <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={() => handleBlur('name')}
                            placeholder="Enter your full name"
                            className={errors.name ? 'error' : ''}
                        />
                        <FormError error={errors.name} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            placeholder="Enter your email"
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
                        required={false}
                        label="Phone Number"
                    />


                    <div className="form-group">
                        <label htmlFor="role">
                            Account Type * {isRoleLocked && <span style={{ color: '#6366f1', fontSize: '0.85rem' }}>(Pre-selected)</span>}
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={isRoleLocked}
                            style={isRoleLocked ? {
                                cursor: 'not-allowed',
                                opacity: 0.7,
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)'
                            } : {}}
                        >
                            <option value="CUSTOMER">Customer</option>
                            <option value="ORG_ADMIN">Organization Admin</option>
                        </select>
                        <small>
                            {isRoleLocked
                                ? `Role locked based on your selection from the home page`
                                : `Choose "Organization Admin" if you want to create and manage an organization`
                            }
                        </small>
                    </div>

                    <PasswordInput
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur('password')}
                        error={errors.password}
                        placeholder="Create a password"
                        label="Password"
                        required={true}
                    >
                        <PasswordStrengthIndicator password={formData.password} />
                    </PasswordInput>

                    <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        error={errors.confirmPassword}
                        placeholder="Confirm your password"
                        label="Confirm Password"
                        required={true}
                        autoComplete="new-password"
                    />

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
