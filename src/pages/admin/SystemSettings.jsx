import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ADMIN_COLLECTIONS } from '../../models/adminSchema';
import { logSettingsUpdate } from '../../utils/auditLogger';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { PERMISSION_CODES } from '../../models/permissions';

const SystemSettings = () => {
    const { userProfile } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        defaultSlotDuration: 30,
        defaultNoShowTimeout: 15,
        qrCheckInEnabled: true,
        notificationsEnabled: true,
        newOrgRegistrationEnabled: true,
        maxEmployeesPerOrg: 50,
        maxServicesPerOrg: 20,
        maxDailyBookingsPerOrg: 500,
        maintenanceMode: false,
        maintenanceMessage: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, ADMIN_COLLECTIONS.SYSTEM_SETTINGS, 'global'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                setSettings(data);
                setFormData(data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const oldSettings = { ...settings };
            const newSettings = {
                ...formData,
                updatedAt: serverTimestamp(),
                updatedBy: userProfile.uid
            };

            await updateDoc(doc(db, ADMIN_COLLECTIONS.SYSTEM_SETTINGS, 'global'), newSettings);

            // Log audit action
            await logSettingsUpdate(oldSettings, newSettings, {
                uid: userProfile.uid,
                name: userProfile.name,
                role: userProfile.role
            });

            toast.success('Settings updated successfully');
            setSettings(newSettings);
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <PermissionGuard permission={PERMISSION_CODES.PLATFORM_MANAGE_SETTINGS} redirect>
            <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="gradient-text">⚙️ System Settings</h1>
                <p>Configure global system settings and defaults</p>

                <form onSubmit={handleSubmit}>
                    <div className="card-glass" style={{ marginBottom: '2rem' }}>
                        <h2>Default Values</h2>

                        <div className="grid grid-cols-1 grid-md-2">
                            <div className="form-group">
                                <label>Default Slot Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={formData.defaultSlotDuration}
                                    onChange={(e) => handleChange('defaultSlotDuration', parseInt(e.target.value))}
                                    min="5"
                                    max="120"
                                />
                            </div>

                            <div className="form-group">
                                <label>Default No-Show Timeout (minutes)</label>
                                <input
                                    type="number"
                                    value={formData.defaultNoShowTimeout}
                                    onChange={(e) => handleChange('defaultNoShowTimeout', parseInt(e.target.value))}
                                    min="5"
                                    max="60"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card-glass" style={{ marginBottom: '2rem' }}>
                        <h2>Organization Limits</h2>

                        <div className="grid grid-cols-1 grid-md-3">
                            <div className="form-group">
                                <label>Max Employees per Organization</label>
                                <input
                                    type="number"
                                    value={formData.maxEmployeesPerOrg}
                                    onChange={(e) => handleChange('maxEmployeesPerOrg', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label>Max Services per Organization</label>
                                <input
                                    type="number"
                                    value={formData.maxServicesPerOrg}
                                    onChange={(e) => handleChange('maxServicesPerOrg', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label>Max Daily Bookings per Organization</label>
                                <input
                                    type="number"
                                    value={formData.maxDailyBookingsPerOrg}
                                    onChange={(e) => handleChange('maxDailyBookingsPerOrg', parseInt(e.target.value))}
                                    min="10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card-glass" style={{ marginBottom: '2rem' }}>
                        <h2>Feature Toggles</h2>

                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.qrCheckInEnabled}
                                    onChange={(e) => handleChange('qrCheckInEnabled', e.target.checked)}
                                />
                                <div>
                                    <div style={{ fontWeight: '600' }}>QR Code Check-in</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Allow customers to check-in using QR codes
                                    </div>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.notificationsEnabled}
                                    onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                                />
                                <div>
                                    <div style={{ fontWeight: '600' }}>Notifications</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Enable push notifications for customers
                                    </div>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.newOrgRegistrationEnabled}
                                    onChange={(e) => handleChange('newOrgRegistrationEnabled', e.target.checked)}
                                />
                                <div>
                                    <div style={{ fontWeight: '600' }}>New Organization Registration</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Allow new organizations to register
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="card-glass" style={{ marginBottom: '2rem' }}>
                        <h2>Maintenance Mode</h2>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer', marginBottom: 'var(--spacing-md)' }}>
                            <input
                                type="checkbox"
                                checked={formData.maintenanceMode}
                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                            />
                            <div>
                                <div style={{ fontWeight: '600', color: formData.maintenanceMode ? 'var(--danger)' : 'inherit' }}>
                                    Enable Maintenance Mode
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Temporarily disable the system for maintenance
                                </div>
                            </div>
                        </label>

                        {formData.maintenanceMode && (
                            <div className="form-group">
                                <label>Maintenance Message</label>
                                <textarea
                                    value={formData.maintenanceMessage}
                                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                                    placeholder="Enter message to display to users during maintenance"
                                    rows="3"
                                />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </PermissionGuard>
    );
};

export default SystemSettings;
