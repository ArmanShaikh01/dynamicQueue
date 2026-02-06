/**
 * FormError Component
 * Displays field-level validation errors with consistent styling
 */
const FormError = ({ error, show = true }) => {
    if (!error || !show) {
        return null;
    }

    return (
        <div
            className="form-error"
            style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                animation: 'fadeIn 0.2s ease-in'
            }}
        >
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span>{error}</span>
        </div>
    );
};

export default FormError;
