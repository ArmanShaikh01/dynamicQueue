import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog glass-strong" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">
                    {type === 'danger' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️'}
                </div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button
                        className="btn-outline touch-target"
                        onClick={onCancel}
                        autoFocus
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn-${type} touch-target`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
