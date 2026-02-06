import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { validateEmail, validatePassword } from '../../utils/validation';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrorMapper';
import FormError from '../../components/common/FormError';
import PasswordInput from '../../components/common/PasswordInput';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const navigate = useNavigate();

    // Clear error when user starts typing
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (errors.email) {
            setErrors({ ...errors, email: null });
        }
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (errors.password) {
            setErrors({ ...errors, password: null });
        }
    };

    // Validate on blur
    const handleEmailBlur = () => {
        const error = validateEmail(email);
        if (error) {
            setErrors({ ...errors, email: error });
        }
    };

    const handlePasswordBlur = () => {
        // For login, only check if password is provided (not strength)
        if (!password || !password.trim()) {
            setErrors({ ...errors, password: 'Password is required' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const emailError = validateEmail(email);
        const passwordError = (!password || !password.trim()) ? 'Password is required' : null;

        if (emailError || passwordError) {
            setErrors({
                email: emailError,
                password: passwordError
            });
            return;
        }

        setLoading(true);
        const result = await login(email.trim(), password);
        setLoading(false);

        if (result.success) {
            toast.success('✅ Login successful! Redirecting...');

            // Redirect based on role
            const role = result.profile?.role;
            switch (role) {
                case 'PLATFORM_ADMIN':
                    navigate('/admin/dashboard');
                    break;
                case 'ORG_ADMIN':
                    navigate('/organization/dashboard');
                    break;
                case 'EMPLOYEE':
                    navigate('/operator/queue');
                    break;
                case 'CUSTOMER':
                    navigate('/customer/search');
                    break;
                default:
                    navigate('/');
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
                    <h1>Welcome Back</h1>
                    <p>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={handleEmailBlur}
                            placeholder="Enter your email"
                            autoComplete="off"
                            className={errors.email ? 'error' : ''}
                        />
                        <FormError error={errors.email} />
                    </div>


                    <PasswordInput
                        id="password"
                        name="password"
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={handlePasswordBlur}
                        error={errors.password}
                        placeholder="Enter your password"
                        label="Password"
                        autoComplete="current-password"
                    />

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
