import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import AdvancedTable from '../../components/admin/AdvancedTable';
import { PERMISSION_CODES } from '../../models/permissions';
import PermissionGuard from '../../components/admin/PermissionGuard';

const NoShowManagement = () => {
    const { userProfile } = useAuth();
    const [noShowAppointments, setNoShowAppointments] = useState([]);
    const [repeatOffenders, setRepeatOffenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        noShowTimeout: 15,
        autoNoShow: true,
        blockThreshold: 3
    });

    useEffect(() => {
        if (!userProfile?.organizationId) return;
        loadNoShowData();
    }, [userProfile?.organizationId]);

    const loadNoShowData = async () => {
        try {
            // Get all no-show appointments for this organization
            const noShowQuery = query(
                collection(db, 'appointments'),
                where('organizationId', '==', userProfile.organizationId),
                where('status', '==', 'NO_SHOW')
            );

            const snapshot = await getDocs(noShowQuery);
            const noShows = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setNoShowAppointments(noShows);

            // Calculate repeat offenders
            const customerNoShowCount = {};
            noShows.forEach(appointment => {
                const customerId = appointment.customerId;
                if (!customerNoShowCount[customerId]) {
                    customerNoShowCount[customerId] = {
                        customerId,
                        customerName: appointment.customerName,
                        customerEmail: appointment.customerEmail,
                        count: 0,
                        appointments: []
                    };
                }
                customerNoShowCount[customerId].count++;
                customerNoShowCount[customerId].appointments.push(appointment);
            });

            // Filter customers with multiple no-shows
            const offenders = Object.values(customerNoShowCount)
                .filter(customer => customer.count >= 2)
                .sort((a, b) => b.count - a.count);

            setRepeatOffenders(offenders);
            setLoading(false);
        } catch (error) {
            console.error('Error loading no-show data:', error);
            toast.error('Failed to load no-show data');
            setLoading(false);
        }
    };

    const handleRevertNoShow = async (appointmentId) => {
        if (!confirm('Revert this no-show appointment?')) return;

        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: 'CANCELLED',
                noShowAt: null,
                markedBy: null,
                revertedAt: new Date(),
                revertedBy: userProfile.uid
            });

            toast.success('No-show reverted');
            loadNoShowData();
        } catch (error) {
            console.error('Error reverting no-show:', error);
            toast.error('Failed to revert no-show');
        }
    };

    const handleBlockCustomer = async (customerId, customerName) => {
        if (!confirm(`Block ${customerName} from future bookings?`)) return;

        try {
            await updateDoc(doc(db, 'users', customerId), {
                isBlocked: true,
                blockedAt: new Date(),
                blockedBy: userProfile.uid,
                blockReason: 'Multiple no-shows'
            });

            toast.success('Customer blocked successfully');
            loadNoShowData();
        } catch (error) {
            console.error('Error blocking customer:', error);
            toast.error('Failed to block customer');
        }
    };

    const handleWarnCustomer = async (customerId, customerName) => {
        toast.success(`Warning sent to ${customerName}`);
        // In a real implementation, this would send an email/notification
    };

    const noShowColumns = [
        {
            key: 'customerName',
            label: 'Customer',
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: '600' }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {row.customerEmail}
                    </div>
                </div>
            )
        },
        {
            key: 'serviceName',
            label: 'Service'
        },
        {
            key: 'appointmentDate',
            label: 'Date',
            render: (value, row) => (
                <div style={{ fontSize: '0.875rem' }}>
                    <div>{value}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{row.appointmentTime}</div>
                </div>
            )
        },
        {
            key: 'noShowAt',
            label: 'Marked At',
            render: (value) => value?.toDate?.()?.toLocaleString() || 'N/A'
        }
    ];

    const offenderColumns = [
        {
            key: 'customerName',
            label: 'Customer',
            render: (value, row) => (
                <div>
                    <div style={{ fontWeight: '600' }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {row.customerEmail}
                    </div>
                </div>
            )
        },
        {
            key: 'count',
            label: 'No-Show Count',
            render: (value) => (
                <span className="badge badge-danger" style={{ fontSize: '1rem' }}>
                    {value} times
                </span>
            )
        }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading no-show data...</p>
            </div>
        );
    }

    return (
        <PermissionGuard permission={PERMISSION_CODES.ORG_MANAGE_QUEUE} redirect>
            <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                <h1 className="gradient-text">❌ No-Show Management</h1>
                <p>Manage no-show appointments and repeat offenders</p>

                {/* Settings */}
                <div className="card-glass" style={{ marginBottom: '2rem' }}>
                    <h2>No-Show Settings</h2>
                    <div className="grid grid-cols-1 grid-md-3">
                        <div className="form-group">
                            <label>No-Show Timeout (minutes)</label>
                            <input
                                type="number"
                                value={settings.noShowTimeout}
                                onChange={(e) => setSettings({ ...settings, noShowTimeout: parseInt(e.target.value) })}
                                min="5"
                                max="60"
                            />
                            <small style={{ color: 'var(--text-secondary)' }}>
                                Auto-mark as no-show after this time
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Block Threshold</label>
                            <input
                                type="number"
                                value={settings.blockThreshold}
                                onChange={(e) => setSettings({ ...settings, blockThreshold: parseInt(e.target.value) })}
                                min="2"
                                max="10"
                            />
                            <small style={{ color: 'var(--text-secondary)' }}>
                                No-shows before suggesting block
                            </small>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.autoNoShow}
                                    onChange={(e) => setSettings({ ...settings, autoNoShow: e.target.checked })}
                                />
                                <div>
                                    <div style={{ fontWeight: '600' }}>Auto No-Show</div>
                                    <small style={{ color: 'var(--text-secondary)' }}>
                                        Automatically mark after timeout
                                    </small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button className="btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                        Save Settings
                    </button>
                </div>

                {/* Statistics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: '2rem'
                }}>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Total No-Shows
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>
                            {noShowAppointments.length}
                        </div>
                    </div>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Repeat Offenders
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>
                            {repeatOffenders.length}
                        </div>
                    </div>
                    <div className="card-glass">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            High Risk (≥{settings.blockThreshold})
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>
                            {repeatOffenders.filter(o => o.count >= settings.blockThreshold).length}
                        </div>
                    </div>
                </div>

                {/* Repeat Offenders */}
                <div className="card-glass" style={{ marginBottom: '2rem' }}>
                    <h2>Repeat Offenders</h2>
                    <AdvancedTable
                        data={repeatOffenders}
                        columns={offenderColumns}
                        actions={(row) => (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleWarnCustomer(row.customerId, row.customerName);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                >
                                    ⚠️ Warn
                                </button>
                                {row.count >= settings.blockThreshold && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBlockCustomer(row.customerId, row.customerName);
                                        }}
                                        className="btn-danger"
                                        style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                                    >
                                        🚫 Block
                                    </button>
                                )}
                            </>
                        )}
                        emptyMessage="No repeat offenders found"
                    />
                </div>

                {/* All No-Shows */}
                <div className="card-glass">
                    <h2>All No-Show Appointments</h2>
                    <AdvancedTable
                        data={noShowAppointments}
                        columns={noShowColumns}
                        actions={(row) => (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRevertNoShow(row.id);
                                }}
                                className="btn-secondary"
                                style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
                            >
                                ↻ Revert
                            </button>
                        )}
                        emptyMessage="No no-show appointments found"
                    />
                </div>
            </div>
        </PermissionGuard>
    );
};

export default NoShowManagement;
